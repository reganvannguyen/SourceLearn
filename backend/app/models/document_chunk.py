from typing import List, Optional
from sqlalchemy import JSON, ForeignKey 
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.db.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id: Mapped[int] = mapped_column(primary_key= True)
    document_id: Mapped[int]= mapped_column(ForeignKey("documents.id"))
    page_number: Mapped[int] = mapped_column()
    text: Mapped[str] = mapped_column()
    embedding: Mapped[list[float]] = mapped_column(Vector(768))


