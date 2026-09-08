from typing import Optional
from sqlalchemy import select
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import embed_query


# Getting the chunks that are close to the question based on embedding, optionally filtered by notebook
def retrieve_chunks(db, question: str, notebook_id: Optional[int] = None, limit: int = 5):
    question_embedding = embed_query(question)

    stmt = select(DocumentChunk)

    if notebook_id is not None:
        stmt = stmt.join(Document, DocumentChunk.document_id == Document.id).where(
            Document.notebook_id == notebook_id
        )

    stmt = stmt.order_by(
        DocumentChunk.embedding.cosine_distance(question_embedding)
    ).limit(limit)

    return db.scalars(stmt).all()
