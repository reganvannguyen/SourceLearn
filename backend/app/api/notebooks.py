from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate, NotebookResponse

router = APIRouter(prefix="/notebooks", tags=["notebooks"])


@router.get("/", response_model=list[NotebookResponse])
def get_notebooks(db: Session = Depends(get_db)):
    stmt = select(Notebook).order_by(Notebook.id.desc())
    notebooks = db.scalars(stmt).all()
    return notebooks


@router.post("/", response_model=NotebookResponse)
def post_notebook(notebook_in: NotebookCreate, db: Session = Depends(get_db)):
    new_notebook = Notebook(name=notebook_in.name, color=notebook_in.color)
    db.add(new_notebook)
    db.commit()
    db.refresh(new_notebook)
    return new_notebook
