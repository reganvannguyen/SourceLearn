from pathlib import Path
import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.notebook import Notebook
from app.schemas.document import DocumentResponse
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import embed_chunks
from app.services.pdf_service import extract_pdf

router = APIRouter(tags=["documents"])

# Ensure uploads directory exists
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/notebooks/{notebook_id}/documents", response_model=list[DocumentResponse])
def get_documents(notebook_id: int, db: Session = Depends(get_db)):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    stmt = select(Document).where(Document.notebook_id == notebook_id).order_by(Document.id.desc())
    documents = db.scalars(stmt).all()
    return [
        DocumentResponse(
            document_id=doc.id,
            file_name=doc.file_name,
            notebook_id=doc.notebook_id,
        )
        for doc in documents
    ]


@router.get("/documents/{document_id}/file")
def get_document_file(document_id: int, db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.file_path or not Path(document.file_path).exists():
        raise HTTPException(status_code=404, detail="PDF file content not found on server")

    return FileResponse(
        path=document.file_path,
        media_type="application/pdf",
        filename=document.file_name,
        headers={"Content-Disposition": f'inline; filename="{document.file_name}"'},
    )


@router.post("/notebooks/{notebook_id}/documents", response_model=DocumentResponse)
async def upload_document(
    notebook_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    original_name = file.filename or "uploaded.pdf"
    file_bytes = await file.read()

    # Save PDF file to disk
    safe_name = re.sub(r"[^\w\-.]", "_", original_name)
    stored_filename = f"{uuid.uuid4().hex}_{safe_name}"
    saved_path = UPLOAD_DIR / stored_filename
    saved_path.write_bytes(file_bytes)

    # Process chunks & embeddings
    pages = await extract_pdf(file_bytes)
    chunks = chunk_pages(pages)
    embedded_chunks = embed_chunks(chunks)

    try:
        document = Document(
            file_name=original_name,
            notebook_id=notebook_id,
            file_path=str(saved_path),
        )

        db.add(document)
        db.flush()
        for chunk in embedded_chunks:
            output = DocumentChunk(
                page_number=chunk["page_number"],
                document_id=document.id,
                text=chunk["text"],
                embedding=chunk["embedding"],
            )
            db.add(output)

        db.commit()
        db.refresh(document)

        return DocumentResponse(
            document_id=document.id,
            file_name=document.file_name,
            notebook_id=document.notebook_id,
        )

    except Exception:
        db.rollback()
        # Clean up file on disk if DB insert fails
        if saved_path.exists():
            saved_path.unlink(missing_ok=True)
        raise
