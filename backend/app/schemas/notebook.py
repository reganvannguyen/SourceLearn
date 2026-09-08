from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotebookCreate(BaseModel):
    name: str
    color: str = "#aa3bff"


# Backward-compatible alias
notebook_creation = NotebookCreate


class NotebookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str = "#aa3bff"
    created_at: datetime | None = None