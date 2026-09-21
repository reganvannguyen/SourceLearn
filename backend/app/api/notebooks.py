from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.message import Message
from app.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate, NotebookResponse, NotebookUpdate
from app.services.s3_service import delete_file

router = APIRouter(prefix="/notebooks", tags=["notebooks"])


@router.get("/", response_model=list[NotebookResponse])
def get_notebooks(db: Session = Depends(get_db)):
    stmt = select(Notebook).order_by(Notebook.id.desc())
    notebooks = db.scalars(stmt).all()
    return notebooks


@router.get("/{notebook_id}", response_model=NotebookResponse)
def get_notebook(notebook_id: int, db: Session = Depends(get_db)):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return notebook


@router.post("/", response_model=NotebookResponse)
def post_notebook(notebook_in: NotebookCreate, db: Session = Depends(get_db)):
    new_notebook = Notebook(
        name=notebook_in.name,
        color=notebook_in.color,
        icon=notebook_in.icon or "book",
    )
    db.add(new_notebook)
    db.commit()
    db.refresh(new_notebook)
    return new_notebook


@router.patch("/{notebook_id}", response_model=NotebookResponse)
def update_notebook(
    notebook_id: int,
    notebook_in: NotebookUpdate,
    db: Session = Depends(get_db),
):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    if notebook_in.name is not None:
        trimmed = notebook_in.name.strip()
        if not trimmed:
            raise HTTPException(status_code=400, detail="Notebook name cannot be empty")
        notebook.name = trimmed
    if notebook_in.color is not None:
        notebook.color = notebook_in.color
    if notebook_in.icon is not None:
        notebook.icon = notebook_in.icon
    db.commit()
    db.refresh(notebook)
    return notebook


@router.delete("/{notebook_id}", status_code=200)
def delete_notebook(notebook_id: int, db: Session = Depends(get_db)):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    # 1. Fetch all documents belonging to this notebook
    docs_stmt = select(Document).where(Document.notebook_id == notebook_id)
    documents = db.scalars(docs_stmt).all()
    doc_ids = [doc.id for doc in documents]

    # 2. Delete all DocumentChunk vector embeddings
    if doc_ids:
        chunk_stmt = delete(DocumentChunk).where(DocumentChunk.document_id.in_(doc_ids))
        db.execute(chunk_stmt)

    # 3. Clean up physical PDF files from S3
    for doc in documents:
        if doc.s3_key:
            try:
                delete_file(doc.s3_key)
            except Exception:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to delete document '{doc.file_name}' from storage",
                )

    # 4. Delete document records
    if doc_ids:
        doc_stmt = delete(Document).where(Document.id.in_(doc_ids))
        db.execute(doc_stmt)

    # 5. Delete conversation history / messages
    msg_stmt = delete(Message).where(Message.notebook_id == notebook_id)
    db.execute(msg_stmt)

    # 6. Delete the notebook record itself
    db.delete(notebook)
    db.commit()

    return {
        "success": True,
        "deleted_notebook_id": notebook_id,
        "deleted_documents": len(doc_ids),
    }

