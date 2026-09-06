from sqlalchemy import select
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import embed_query

#Getting the chunks that are close to the question Based on embedding
def retrieve_chunks(db, question: str, limit: int = 5):
    question_embedding = embed_query(question) #embedded quesiton to get chunk that are close to the quesiton

    stmt = (
        select(DocumentChunk)
        .order_by(
            DocumentChunk.embedding.cosine_distance(question_embedding)
        )
        .limit(limit)
    )

    return db.scalars(stmt).all()





