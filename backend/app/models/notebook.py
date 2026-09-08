from typing import List, Optional
from datetime import datetime
from sqlalchemy import JSON, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Notebook(Base):
    __tablename__ = "notebooks"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    color: Mapped[str] = mapped_column(default="#aa3bff")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())