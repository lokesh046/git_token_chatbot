import streamlit as st
from openai import OpenAI
import os

# RAG functions
from rag import extract_text_from_pdf, create_vector_store, search

# --- Load client ---
client = OpenAI(
    api_key="",
    base_url="https://models.inference.ai.azure.com"
)


# --- UI Title ---
st.set_page_config(page_title="PDF RAG Chatbot", layout="wide")
st.title("📄💬 PDF RAG Chatbot (GitHub Models)")

# --- Sidebar ---
with st.sidebar:
    st.header("⚙️ Settings")

    model = st.selectbox(
        "Choose Model",
        ["gpt-4o-mini", "gpt-4o"]
    )

    temperature = st.slider("Creativity", 0.0, 1.0, 0.7)

    if st.button("🗑️ Clear Chat"):
        st.session_state.messages = []

# --- Initialize chat memory ---
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "system", "content": "You are a helpful AI assistant."}
    ]

# --- PDF Upload ---
uploaded_file = st.file_uploader("📤 Upload a PDF", type="pdf")

if uploaded_file:
    with st.spinner("Processing PDF..."):
        text = extract_text_from_pdf(uploaded_file)
        index, chunks = create_vector_store(text)

        st.session_state.index = index
        st.session_state.chunks = chunks

    st.success("✅ PDF processed successfully!")

# --- Display chat history ---
for msg in st.session_state.messages:
    if msg["role"] != "system":
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# --- User Input ---
prompt = st.chat_input("Ask something about your PDF...")

if prompt:
    # Show user message
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # --- RAG Context ---
    if "index" in st.session_state:
        context = search(prompt, st.session_state.index, st.session_state.chunks)
        context_text = "\n".join(context)

        final_prompt = f"""
Answer ONLY using the context below.
If the answer is not in the context, say "I don't know".

Context:
{context_text}

Question:
{prompt}
"""
    else:
        final_prompt = prompt

    # --- Streaming Response ---
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""

        stream = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": final_prompt}],
            temperature=temperature,
            stream=True
        )

        for chunk in stream:
            if not chunk.choices:
                continue

            delta = chunk.choices[0].delta

            if hasattr(delta, "content") and delta.content:
                full_response += delta.content
                message_placeholder.markdown(full_response + "▌")
        
        message_placeholder.markdown(full_response)

    # Save assistant response
    st.session_state.messages.append(
        {"role": "assistant", "content": full_response}
    )