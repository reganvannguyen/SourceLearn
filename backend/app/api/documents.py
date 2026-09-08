from fastapi import FastAPI, UploadFile, Depends
from sqlalchemy.orm import Session
from app.services.pdf_service import extract_pdf
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import embed_chunks
from app.models.document import Document
from app.models.document_chunk import DocumentChunk 
from app.db.database import get_db
from fastapi import APIRouter

router = APIRouter( prefix= "/documents", tags=["documents"])



@router.post("/")
async def upload_document(file: UploadFile, db: Session = Depends(get_db)):
    pages = await extract_pdf(file)
    chunks = chunk_pages(pages)
    embedded_chunks = embed_chunks(chunks)


    try:
        document = Document(file_name= file.filename)

        db.add(document)
        db.flush()
        for chunk in embedded_chunks:
            output = DocumentChunk(
                page_number=chunk["page_number"],
                document_id=document.id,
                text=chunk["text"],
                embedding=chunk["embedding"]
            )
            db.add(output)

        db.commit()
        db.refresh(document)

        document_info = {"document_id": document.id, "file_name": document.file_name}
        return document_info

    except Exception:
        db.rollback()
        raise

        

   




