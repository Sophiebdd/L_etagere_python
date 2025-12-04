from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.models.book import Book   # ✅ import direct de la classe Book
from app.models.book_note import BookNote
from app.schemas import (
    Book as BookSchema,
    BookCreate,
    BookUpdate,
    BookNote as BookNoteSchema,
    BookNoteCreate,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/books", tags=["Books"])


def _get_user_book_or_404(book_id: int, user_id: int, db: Session) -> Book:
    book = (
        db.query(Book)
        .options(selectinload(Book.notes))
        .filter(Book.id == book_id, Book.user_id == user_id)
        .first()
    )
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livre introuvable")
    return book

@router.post("/", response_model=BookSchema)
def create_book(book: BookCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_book = Book(**book.dict(), user_id=user.id)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.get("/", response_model=list[BookSchema])
def list_books(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(Book)
        .options(selectinload(Book.notes))
        .filter(Book.user_id == user.id)
        .order_by(Book.created_at.desc())
        .all()
    )

@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    book = _get_user_book_or_404(book_id, user.id, db)
    db.delete(book)
    db.commit()
    return {"message": "Livre supprimé avec succès"}


@router.patch("/{book_id}", response_model=BookSchema)
def update_book(book_id: int, book_update: BookUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    book = _get_user_book_or_404(book_id, user.id, db)

    update_data = book_update.dict(exclude_unset=True, exclude_none=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)
    return book

@router.get("/mine", response_model=list[BookSchema])
def get_my_books(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Retourne les livres ajoutés par l'utilisateur connecté"""
    books = (
        db.query(Book)
        .options(selectinload(Book.notes))
        .filter(Book.user_id == user.id)
        .order_by(Book.created_at.desc())
        .all()
    )
    return books


@router.get("/{book_id}/notes", response_model=list[BookNoteSchema])
def list_book_notes(book_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    book = _get_user_book_or_404(book_id, user.id, db)
    return book.notes


@router.post(
    "/{book_id}/notes",
    response_model=BookNoteSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_book_note(
    book_id: int,
    note: BookNoteCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _get_user_book_or_404(book_id, user.id, db)
    book_note = BookNote(content=note.content, book_id=book_id)
    db.add(book_note)
    db.commit()
    db.refresh(book_note)
    return book_note


@router.delete("/{book_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book_note(
    book_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _get_user_book_or_404(book_id, user.id, db)
    note = (
        db.query(BookNote)
        .filter(BookNote.id == note_id, BookNote.book_id == book_id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note introuvable")
    db.delete(note)
    db.commit()
