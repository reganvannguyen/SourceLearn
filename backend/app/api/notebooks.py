from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate, NotebookResponse, NotebookUpdate

router = APIRouter(prefix="/notebooks", tags=["notebooks"])


@router.get("/", response_model=list[NotebookResponse])
def get_notebooks(db: Session = Depends(get_db)):
    stmt = select(Notebook).order_by(Notebook.id.desc())
    notebooks = db.scalars(stmt).all()
    return notebooks


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

