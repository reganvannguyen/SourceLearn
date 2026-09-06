from fastapi import FastAPI, Depends, HTTPException, status
from app.db.database import get_db
from app.services.retrieval_service import retrieve_chunks
from app.services.llm_service import generate_answer
from sqlalchemy.orm import Session
from app.schemas.question import QuestionRequest, AnswerResponse


app = FastAPI()


@app.post("/questions", response_model=AnswerResponse)
def post_questions(request: QuestionRequest ,db: Session = Depends(get_db)):

    chunks = retrieve_chunks(db, request.question)
    print(f"Retrieved {len(chunks)} chunks")
    print("Generating answer...")

    answer_text = generate_answer(request.question,chunks)
    result = AnswerResponse.model_validate_json(answer_text)

    retrieved_ids = {chunk.id for chunk in chunks}
    invalid_ids = set(result.citations) - retrieved_ids

    if invalid_ids:
        raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Model cited chunks that were not retrieved: {invalid_ids}"
    )
    
    return result


