from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class CitationItem(BaseModel):
    chunk_id: int
    document_id: int
    file_name: str
    page_number: int
    snippet: str


class MessageCreateRequest(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    notebook_id: int
    sender: str
    content: str
    citations: List[CitationItem] = []
    created_at: datetime

    class Config:
        from_attributes = True
