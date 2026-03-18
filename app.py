import streamlit as st
from openai import OpenAI
from rag import search
import os

# --- Setup client ---
client = OpenAI(
    api_key="",
    base_url="https://models.inference.ai.azure.com"
)

st.title("💬 GitHub AI Chatbot")

# --- Store chat history ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# --- Display old messages ---
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# --- User input ---
prompt = st.chat_input("Ask something...")

if prompt:
    # Show user message
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Call model
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=st.session_state.messages
    )

    reply = response.choices[0].message.content

    # Show assistant reply
    st.chat_message("assistant").markdown(reply)
    st.session_state.messages.append({"role": "assistant", "content": reply})