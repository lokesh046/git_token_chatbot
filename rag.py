from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from pypdf import PdfReader

model = SentenceTransformer("all-MiniLM-L6-v2")

def extract_text_from_pdf(pdf_file):
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def chunk_text(text, chunk_size=300):
    chunks = []
    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i+chunk_size])
    return chunks


def create_vector_store(text):
    chunks = chunk_text(text)
    embeddings = model.encode(chunks)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings))

    return index, chunks


def search(query, index, chunks, k=3):
    query_embedding = model.encode([query])
    distances, indices = index.search(query_embedding, k)

    return [chunks[i] for i in indices[0]]