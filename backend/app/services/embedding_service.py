import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured")

client = genai.Client(api_key=api_key)




def embed_chunks(chunks: list[dict]) -> list[dict]:
    embedded_chunks = []
    for chunk in chunks:
        response = client.models.embed_content(
            model= "gemini-embedding-2",
            contents = chunk["text"],
            config= types.EmbedContentConfig(output_dimensionality= 768 )
        )
        embedded_chunks.append({
            "page_number": chunk["page_number"],
            "text": chunk["text"],
            "embedding": response.embeddings[0].values
        })

    return embedded_chunks



def embed_query(question: str) -> list[float]:
    response = client.models.embed_content(
        model="gemini-embedding-2",
        contents=question,
        config=types.EmbedContentConfig( output_dimensionality=768)
    )

    return response.embeddings[0].values