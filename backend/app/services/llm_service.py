import os 
from dotenv import load_dotenv
from google import genai 
from google.genai import types
from app.schemas.question import AnswerResponse
#to get output from ai in a structure json 


load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured")

client = genai.Client(api_key=api_key)


def generate_answer(question: str, chunks: list):
    try:

        if not chunks:
            return AnswerResponse(answer= "the provided sources do not contain enough information.", citations=[]).model_dump_json()
    
        context = "\n\n".join(
            f"[chunk_id={chunk.id}, page={chunk.page_number}]\n{chunk.text}" for chunk in chunks)

        
        prompt = f"""
        Answer the question using only the provided context.
        Each context chunk has a chunk ID.
        Return the IDs of every chunk that directly supports your answer.
        If the provided context does not contain enough information,
        say so and return an empty citations list.


        Context:
        {context}

        Question:
        {question}
        """

        response = client.models.generate_content(
            model = "gemini-2.5-flash", 
            contents = prompt, 
            config = types.GenerateContentConfig(response_mime_type="application/json",
                                                 response_schema= AnswerResponse
                    ),
            )

        
        return response.text
    
    except Exception:
        raise
