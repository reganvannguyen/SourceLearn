from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotebookCreate(BaseModel):
    name: str
    color: str = "#aa3bff"
    icon: str = "book"


class NotebookUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    icon: str | None = None


# Backward-compatible alias
notebook_creation = NotebookCreate


class NotebookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str = "#aa3bff"
    icon: str = "book"
    created_at: datetime | None = None