from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, field_validator

from .note import BookNote as BookNoteSchema


class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    status: Optional[str] = None
    publication_date: Optional[date] = None
    isbn: Optional[str] = None
    cover_image: Optional[str] = None
    external_id: Optional[str] = None
    genre: Optional[str] = None
    is_favorite: Optional[bool] = False

    @field_validator("publication_date", mode="before")
    @classmethod
    def normalize_publication_date(cls, value):
        if value in (None, ""):
            return None
        if isinstance(value, date) and not isinstance(value, datetime):
            return value
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, str):
            raw_value = value.strip()
            if not raw_value:
                return None
            if len(raw_value) == 4:
                return date.fromisoformat(f"{raw_value}-01-01")
            if len(raw_value) == 7:
                return date.fromisoformat(f"{raw_value}-01")
            if "T" in raw_value:
                return datetime.fromisoformat(raw_value.replace("Z", "+00:00")).date()
            return date.fromisoformat(raw_value)
        return value


class BookCreate(BookBase):
    """Schéma utilisé à la création d’un livre"""
    pass


class BookUpdate(BaseModel):
    status: Optional[str] = None
    genre: Optional[str] = None
    is_favorite: Optional[bool] = None


class Book(BookBase):
    """Schéma utilisé en réponse API"""
    id: int
    user_id: int
    created_at: datetime
    notes: List[BookNoteSchema] = []

    model_config = ConfigDict(from_attributes=True)


class BookPage(BaseModel):
    items: List[Book]
    total_items: int
    page: int
    page_size: int


class BookRecommendation(BaseModel):
    external_id: Optional[str] = None
    title: str
    author: Optional[str] = None
    description: Optional[str] = None
    publication_date: Optional[str] = None
    isbn: Optional[str] = None
    cover_image: Optional[str] = None
    genre: Optional[str] = None
    language: Optional[str] = None
    score: Optional[float] = None
