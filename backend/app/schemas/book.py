from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List
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
