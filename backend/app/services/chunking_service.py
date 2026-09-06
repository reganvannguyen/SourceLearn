import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from langchain_text_splitters import RecursiveCharacterTextSplitter





def chunk_pages(pages: list[dict]) -> list[dict]:
    all_chunks = []

    for page in pages:
        page_text = page["text"]

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )

        chunks = text_splitter.split_text(page_text)

        for chunk in chunks:
            all_chunks.append({
                "page_number": page["page_number"],
                "text": chunk
            })

    return all_chunks
