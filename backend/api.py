import os
import tempfile
import sqlite3
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI

# Fix for PostgreSQL invalid CA bundle breaking Python requests
import os
os.environ.pop('CURL_CA_BUNDLE', None)
os.environ.pop('REQUESTS_CA_BUNDLE', None)

from rag import extract_text_from_pdf, create_vector_store, search

# Load environment variables from .env file
load_dotenv()

# Check for either OPENAI_API_KEY or GITHUB_TOKEN
api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("GITHUB_TOKEN", "")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key=api_key,
    base_url="https://models.inference.ai.azure.com"
)

# In-memory vector store for MVP Document context
vector_store = {"index": None, "chunks": None}

DB_PATH = "chat_history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS sessions (
                        id TEXT PRIMARY KEY,
                        title TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT,
                        role TEXT,
                        content TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (session_id) REFERENCES sessions (id)
                    )''')
    conn.commit()
    conn.close()

init_db()

class SessionCreate(BaseModel):
    title: str = "New Chat"

@app.post("/sessions")
def create_session(session: SessionCreate):
    session_id = str(uuid.uuid4())
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO sessions (id, title) VALUES (?, ?)", (session_id, session.title))
    conn.commit()
    conn.close()
    return {"id": session_id, "title": session.title}

@app.get("/sessions")
def get_sessions():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    # Order by oldest to newest if you want, but newest first is better for sidebar
    cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC")
    sessions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return sessions

@app.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

@app.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
    messages = [{"role": row["role"], "content": row["content"], "id": hash(row["content"])} for row in cursor.fetchall()]
    conn.close()
    return {"messages": messages}

class ChatRequest(BaseModel):
    session_id: str
    prompt: str
    model: str = "gpt-4o"
    temperature: float = 0.7

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        content = await file.read()
        temp.write(content)
        temp_path = temp.name
        
    try:
        text = extract_text_from_pdf(temp_path)
        index, chunks = create_vector_store(text)
        vector_store["index"] = index
        vector_store["chunks"] = chunks
        return {"filename": file.filename, "status": "processed"}
    finally:
        os.remove(temp_path)

@app.get("/models")
async def get_models():
    try:
        models = client.models.list()
        return {"models": [model.id for model in models.data]}
    except Exception as e:
        return {"models": ["gpt-4o", "gpt-4o-mini"], "error": str(e)}

@app.post("/chat")
async def chat(request: ChatRequest):
    # Fetch history
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC", (request.session_id,))
    db_messages = cursor.fetchall()
    
    messages_dict = [{"role": row["role"], "content": row["content"]} for row in db_messages]
    
    # Process the new prompt
    final_prompt = request.prompt
    
    # RAG Context checking
    if vector_store["index"] is not None:
        context = search(request.prompt, vector_store["index"], vector_store["chunks"])
        context_text = "\n".join(context)
        final_prompt = f"""Answer ONLY using the context below.
Keep your answer clear, concise, and strictly minimal.
If the answer is not in the context, say "I don't know".

Context:
{context_text}

Question:
{request.prompt}"""
        
    # Standard format System + History + User
    # OpenAI expects "system", "user", "assistant"
    # Wait, the history from db doesn't naturally have a system prompt if we didn't save one.
    
    api_messages = [{"role": "system", "content": "You are a helpful AI assistant. Always provide clear, concise, and minimal answers. Do not over-explain."}] + messages_dict
    api_messages.append({"role": "user", "content": final_prompt})
    
    # Call LLM
    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=api_messages,
            temperature=request.temperature
        )
        reply = response.choices[0].message.content
    except Exception as e:
        reply = "Error: " + str(e)

    # Save User message to DB (the original prompt, not the RAG-modified one)
    cursor.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
                   (request.session_id, "user", request.prompt))
    
    # Save Assistant message to DB
    cursor.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
                   (request.session_id, "assistant", reply))
                   
    conn.commit()
    conn.close()
    
    return {"reply": reply}
