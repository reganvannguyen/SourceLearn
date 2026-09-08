import os
import time
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types
from app.schemas.question import AnswerResponse

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured")

client = genai.Client(api_key=api_key)


def _call_with_retry(fn, max_retries: int = 3, initial_delay: float = 1.0):
    """Executes a Gemini API call with exponential backoff on temporary 503/429 errors."""
    delay = initial_delay
    last_err = None
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            last_err = e
            err_str = str(e)
            if "503" in err_str or "429" in err_str or "UNAVAILABLE" in err_str:
                print(f"Gemini API temporary issue ({e}). Retrying in {delay}s (attempt {attempt + 1}/{max_retries})...")
                time.sleep(delay)
                delay *= 1.5
            else:
                raise
    raise last_err


def condense_query(question: str, chat_history: Optional[List[dict]] = None) -> str:
    """
    Given the chat history and the latest user question, rephrases the question into a
    standalone search query if it references prior context (e.g. 'that', 'the second one').
    If the question is already self-contained or starts a new topic, returns it unchanged.
    """
    if not chat_history:
        return question

    history_lines = []
    for msg in chat_history[-6:]:
        role = "User" if msg.get("role") == "user" else "Assistant"
        content = msg.get("content", "").strip()
        if content:
            history_lines.append(f"{role}: {content}")

    if not history_lines:
        return question

    history_text = "\n".join(history_lines)

    prompt = f"""Given the following conversation history and follow-up question, rephrase the follow-up question into a standalone search query.
If the question references previous conversation (e.g. using 'that', 'it', 'the second point', 'why?', 'tell me more'), rewrite it to be complete and self-contained so that a document search engine can find relevant information.
If the question is already standalone or introduces an independent topic, output the original question exactly as-is.
Return ONLY the standalone query, with no explanations or quotes around it.

Conversation History:
{history_text}

Follow-up Question:
{question}

Standalone Query:"""

    try:
        def call_gemini():
            return client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )

        response = _call_with_retry(call_gemini, max_retries=3, initial_delay=1.0)
        condensed = response.text.strip()
        return condensed if condensed else question
    except Exception as e:
        print(f"Error in condense_query: {e}. Falling back to original question.")
        return question


def generate_answer(
    question: str,
    chunks: list,
    chat_history: Optional[List[dict]] = None,
) -> str:
    try:
        if not chunks:
            return AnswerResponse(
                answer="The provided sources do not contain enough information.",
                citations=[],
            ).model_dump_json()

        context = "\n\n".join(
            f"[chunk_id={chunk.id}, page={chunk.page_number}]\n{chunk.text}"
            for chunk in chunks
        )

        history_block = ""
        if chat_history:
            history_lines = []
            for msg in chat_history[-6:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                content = msg.get("content", "").strip()
                if content:
                    history_lines.append(f"{role}: {content}")
            if history_lines:
                history_block = f"\nRecent Conversation:\n" + "\n".join(history_lines) + "\n"

        prompt = f"""Answer the question using the provided context and recent conversation history.
Each context chunk has a chunk ID.

IMPORTANT CITATION INSTRUCTIONS:
1. Place inline citations directly after each sentence or claim using the bracketed chunk ID, e.g. "An operating system coordinates shared hardware [17]." or "It provides private memory illusions [39]."
2. If multiple chunks support a single sentence, group them like [17, 39].
3. Every factual sentence or claim drawn from the context must have an inline citation right after it.
4. In the JSON "citations" field, return the list of all chunk IDs cited in your text.
5. If the context does not contain enough information, say so clearly and return an empty citations list.
{history_block}
Context:
{context}

Question:
{question}
"""

        def call_generate():
            return client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AnswerResponse,
                ),
            )

        response = _call_with_retry(call_generate, max_retries=3, initial_delay=1.0)
        return response.text

    except Exception:
        raise
