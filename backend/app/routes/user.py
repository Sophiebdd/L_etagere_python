from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.passwords import validate_password_policy
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserAdminRead,
    UserBookStatsRead,
    UserCreate,
    UserRead,
    UserStatusUpdate,
)
from app.core.security import get_current_admin, get_current_user, hash_password


router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=list[UserAdminRead], dependencies=[Depends(get_current_admin)])
def list_users(
    q: str | None = Query(default=None, min_length=1, max_length=100),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            (User.username.ilike(like)) | (User.email.ilike(like))
        )
    return query.order_by(User.created_at.desc()).all()

@router.post("", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    validate_password_policy(user.password)

    # Vérifie si email déjà utilisé
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # Crée l'utilisateur
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/me/book-stats", response_model=UserBookStatsRead)
def get_my_book_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.execute(
            text(
                """
                SELECT
                    user_id,
                    username,
                    total_books,
                    to_read_count,
                    in_progress_count,
                    read_count,
                    favorite_count,
                    last_book_added_at
                FROM user_book_stats
                WHERE user_id = :user_id
                """
            ),
            {"user_id": user.id},
        )
        .mappings()
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistiques utilisateur introuvables",
        )

    return UserBookStatsRead(**row)


@router.patch("/{user_id}/status", response_model=UserAdminRead, dependencies=[Depends(get_current_admin)])
def update_user_status(user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user
