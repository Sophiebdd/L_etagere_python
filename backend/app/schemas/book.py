from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    status: Optional[str] = None
    publication_date: Optional[date] = None
    isbn: Optional[str] = None
    cover_image: Optional[str] = None
    external_id: Optional[str] = None


class BookCreate(BookBase):
    """Schéma utilisé à la création d’un livre"""
    pass


class Book(BookBase):
    """Schéma utilisé en réponse API"""
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True  # remplace l’ancien orm_mode=True
