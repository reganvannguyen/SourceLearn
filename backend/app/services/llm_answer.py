from app.db.database import Session_local
from app.services.retrieval_service import retrieve_chunks
from app.services.llm_service import generate_answer
from app.services.llm_service import AnswerResponse





if __name__ == "__main__":

    db = Session_local()
    try:
        question = "What is the purpose of an operating system?"

        chunks = retrieve_chunks(db,question)
        print(f"Retrieved {len(chunks)} chunks")
        print("Generating answer...")

        answer_text = generate_answer(question,chunks)
        result = AnswerResponse.model_validate_json(answer_text)

        retrieved_ids = {chunk.id for chunk in chunks}
        invalid_ids = set(result.citations) - retrieved_ids

        if invalid_ids:
            raise ValueError(
                f"Model cited chunks that were not retrieved: {invalid_ids}"
            )
        
        print("ANSWER:")
        print(result.answer)
        print(result.citations)


        
    finally:
        db.close()

