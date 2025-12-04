from datetime import datetime
from pydantic import BaseModel


class BookNoteBase(BaseModel):
    content: str


class BookNoteCreate(BookNoteBase):
    """Payload pour créer une note."""


class BookNoteUpdate(BaseModel):
    content: str | None = None


class BookNote(BookNoteBase):
    id: int
    book_id: int
    created_at: datetime

    class Config:
        from_attributes = True
