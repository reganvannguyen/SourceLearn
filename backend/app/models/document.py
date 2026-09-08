from typing import List
from typing import Optional
from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped,  mapped_column, relationship
from app.db.base import Base



class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    notebook_id: Mapped[int] = mapped_column(ForeignKey("notebooks.id"))
    file_name: Mapped[str] = mapped_column()
    file_path: Mapped[str] = mapped_column(default="")




