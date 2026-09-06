from pathlib import Path

from app.services.pdf_service import extract_pdf
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import embed_chunks

from app.models.document import Document
from app.models.document_chunk import DocumentChunk

from app.db.database import Session_local, engine
from app.db.base import Base


def process_document(pdf_path: str):
    pages = extract_pdf(pdf_path)
    chunks = chunk_pages(pages)
    embedded_chunks = embed_chunks(chunks)

    db = Session_local()

    try:
        document = Document(
            file_name=Path(pdf_path).name
        )

        db.add(document)
        db.flush()
        db.refresh(document)

        for chunk in embedded_chunks:
            output = DocumentChunk(
                page_number=chunk["page_number"],
                document_id=document.id,
                text=chunk["text"],
                embedding=chunk["embedding"]
            )

            db.add(output)

        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    from sqlalchemy import text

    with engine.begin() as connection:
        connection.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector")
        )

    Base.metadata.create_all(bind=engine)

    process_document(
        "/home/regan-nguyen/Desktop/projects/SourceLearn/backend/app/services/Topic 1 - Introduction_to_Operating_Systems_History.pdf"
    )