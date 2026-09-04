import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key = os.getenv("GEMINI_API_KEY"))




def embed_chunks(chunks: list[dict]) -> list[dict]:
    embed_chunks = []
    for chunk in chunks:
        response = client.models.embed_content(
            model= "gemini-embedding-2",
            contents = chunk["text"]
        )
        embed_chunks.append({
            "page_number": chunk["page_number"],
            "text": chunk["text"],
            "embedding": response.embeddings[0].values
        })

    return embed_chunks
