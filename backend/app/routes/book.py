from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.models.book import Book   # ✅ import direct de la classe Book
from app.models.book_note import BookNote
from app.schemas import (
    Book as BookSchema,
    BookCreate,
    BookUpdate,
    BookPage,
    BookRecommendation,
    BookNote as BookNoteSchema,
    BookNoteCreate,
)
from app.core.security import get_current_user
from app.services.embeddings import build_book_text, embed_text
from app.services.recommendations import recommend_books

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
    if book.external_id:
        existing = (
            db.query(Book)
            .filter(Book.user_id == user.id, Book.external_id == book.external_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Livre déjà dans la bibliothèque",
            )

    db_book = Book(**book.model_dump(), user_id=user.id)
    book_text = build_book_text(
        db_book.title,
        db_book.author,
        db_book.description,
        db_book.genre,
    )
    db_book.embedding = embed_text(book_text) or None
    db.add(db_book)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Livre déjà dans la bibliothèque",
        )
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

    update_data = book_update.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    if {"title", "author", "description", "genre"} & set(update_data.keys()):
        book_text = build_book_text(
            book.title,
            book.author,
            book.description,
            book.genre,
        )
        book.embedding = embed_text(book_text) or None

    db.commit()
    db.refresh(book)
    return book

@router.get("/mine", response_model=BookPage)
def get_my_books(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = None,
    favorites: bool | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Retourne les livres ajoutés par l'utilisateur connecté"""
    base_query = (
        db.query(Book)
        .options(selectinload(Book.notes))
        .filter(Book.user_id == user.id)
    )

    if status_filter:
        base_query = base_query.filter(Book.status == status_filter)
    if favorites is not None:
        base_query = base_query.filter(Book.is_favorite == favorites)
    if search and search.strip():
        term = f"%{search.strip()}%"
        base_query = base_query.filter(
            or_(Book.title.ilike(term), Book.author.ilike(term))
        )

    total_items = base_query.order_by(None).count()
    books = (
        base_query.order_by(Book.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": books,
        "total_items": total_items,
        "page": page,
        "page_size": page_size,
    }


@router.get("/recommendations", response_model=list[BookRecommendation])
def get_recommendations(
    limit: int = Query(12, ge=1, le=40),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return recommend_books(db, user.id, limit=limit)


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
