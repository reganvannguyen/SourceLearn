import os 
from dotenv import load_dotenv
from google import genai 
from pydantic import BaseModel
from google.genai import types


class AnswerResponse(BaseModel):
    answer: str
    citations: list[int]

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured")

client = genai.Client(api_key=api_key)


def generate_answer(question: str, chunks: list):
    try:

        if not chunks:
            return "The provided sources do not contain enough information."
    
        context = "\n\n".join(
        f"[page {chunk.page_number}]\n{chunk.text}"
        for chunk in chunks
    )
        prompt = f"""
        Answer in 2–4 sentences using only the context.
        Include page citations like [page 4] after relevant claims.
        If the context does not support the answer, say so clearly.

        Context:
        {context}

        Question"
        {question}
        """

        response = client.models.generate_content(model = "gemini-2.5-flash", contents = prompt)
        return response.text
    
    except Exception as e:
        return f"an error occurred: {e}"
