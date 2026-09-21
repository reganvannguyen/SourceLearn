import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.notebook import Notebook
from app.schemas.document import DocumentResponse
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import embed_chunks
from app.services.pdf_service import extract_pdf, highlight_pdf_snippet
from app.services.s3_service import upload_file, get_file, delete_file

router = APIRouter(tags=["documents"])



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
def get_document_file(
    document_id: int,
    page: Optional[int] = None,
    snippet: Optional[str] = None,
    color: Optional[str] = None,
    db: Session = Depends(get_db),
):
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.s3_key:
        raise HTTPException(status_code=404, detail="PDF file content not found in S3")

    try:
        pdf_bytes = get_file(document.s3_key)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"PDF file could not be retrieved from S3: {e}")

    # If page and snippet are provided, dynamically highlight and stream PDF in memory
    if page and snippet and snippet.strip():
        try:
            highlighted_bytes = highlight_pdf_snippet(
                pdf_source=pdf_bytes,
                page_number=page,
                snippet=snippet,
                color_hex=color or "#fde047",
            )
            return Response(
                content=highlighted_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'inline; filename="{document.file_name}"',
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                },
            )
        except Exception as e:
            # Fall back to raw file if highlighting fails
            print(f"Highlighting failed, falling back to original file: {e}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{document.file_name}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
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

    safe_name = re.sub(r"[^\w\-.]", "_", original_name)
    stored_filename = f"{uuid.uuid4().hex}_{safe_name}"
    s3_key = f"notebooks/{notebook_id}/documents/{stored_filename}"

    s3_uploaded = False

    try:
        upload_file(
            file_bytes,
            s3_key,
            content_type=file.content_type or "application/pdf",
        )
        s3_uploaded = True

        pages = await extract_pdf(file_bytes)
        chunks = chunk_pages(pages)
        embedded_chunks = embed_chunks(chunks)

        document = Document(
            file_name=original_name,
            notebook_id=notebook_id,
            s3_key=s3_key,
        )

        db.add(document)
        db.flush()

        for chunk in embedded_chunks:
            db.add(
                DocumentChunk(
                    page_number=chunk["page_number"],
                    document_id=document.id,
                    text=chunk["text"],
                    embedding=chunk["embedding"],
                )
            )

        db.commit()
        db.refresh(document)

        return DocumentResponse(
            document_id=document.id,
            file_name=document.file_name,
            notebook_id=document.notebook_id,
        )

    except Exception:
        db.rollback()
        if s3_uploaded:
            try:
                delete_file(s3_key)
            except Exception:
                pass
        raise


@router.delete("/documents/{document_id}", status_code=200)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from S3 bucket first to prevent orphaned storage objects
    if doc.s3_key:
        try:
            delete_file(doc.s3_key)
        except Exception:
            raise HTTPException(
                status_code=502,
                detail="Failed to delete document from storage",
            )

    # Delete vector embeddings / chunks
    chunk_stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
    chunk_res = db.execute(chunk_stmt)
    deleted_chunks = chunk_res.rowcount

    # Delete document record
    doc_stmt = delete(Document).where(Document.id == document_id)
    db.execute(doc_stmt)
    db.commit()

    return {
        "success": True,
        "deleted_chunks": deleted_chunks,
    }

