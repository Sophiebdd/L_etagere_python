from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.book import Book   # ✅ import direct de la classe Book
from app.schemas import Book as BookSchema, BookCreate, BookUpdate
from app.core.security import get_current_user

router = APIRouter(prefix="/books", tags=["Books"])

@router.post("/", response_model=BookSchema)
def create_book(book: BookCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_book = Book(**book.dict(), user_id=user.id)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.get("/", response_model=list[BookSchema])
def list_books(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Book).filter(Book.user_id == user.id).all()

@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livre introuvable")
    db.delete(book)
    db.commit()
    return {"message": "Livre supprimé avec succès"}


@router.patch("/{book_id}", response_model=BookSchema)
def update_book(book_id: int, book_update: BookUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == user.id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livre introuvable")

    update_data = book_update.dict(exclude_unset=True, exclude_none=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)
    return book

@router.get("/mine", response_model=list[BookSchema])
def get_my_books(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Retourne les livres ajoutés par l'utilisateur connecté"""
    books = db.query(Book).filter(Book.user_id == user.id).all()
    return books
