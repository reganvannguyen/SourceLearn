from app.db.database import Session_local
from app.services.retrieval_service import retrieve_chunks
from app.services.llm_service import generate_answer






if __name__ == "__main__":

    db = Session_local()
    try:
        question = "What is the purpose of an operating system?"

        chunks = retrieve_chunks(db,question)
        print(f"Retrieved {len(chunks)} chunks")
        print("Generating answer...")

        answer = generate_answer(question,chunks)
        print("ANSWER:")
        print(answer)

        
    finally:
        db.close()

