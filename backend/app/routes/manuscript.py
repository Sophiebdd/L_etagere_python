from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_current_user
from app.database import get_db
from app.models.manuscript import Manuscript
from app.models.chapter import Chapter
from app.schemas import (
    Chapter as ChapterSchema,
    ChapterCreate,
    ChapterUpdate,
    ChapterWithManuscript,
    Manuscript as ManuscriptSchema,
    ManuscriptCreate,
    ManuscriptShareRequest,
    ManuscriptUpdate,
)
from app.services.email import EmailError
from app.services.manuscript_share import share_manuscript_via_email

router = APIRouter(prefix="/manuscripts", tags=["Manuscripts"])


def _get_user_manuscript_or_404(manuscript_id: int, user_id: int, db: Session) -> Manuscript:
    """Récupère un manuscrit appartenant à l'utilisateur ou lève une 404."""
    manuscript = (
        db.query(Manuscript)
        .options(selectinload(Manuscript.chapters))
        .filter(Manuscript.id == manuscript_id, Manuscript.user_id == user_id)
        .first()
    )
    if not manuscript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manuscrit introuvable")
    return manuscript


def _get_user_chapter_or_404(chapter_id: int, user_id: int, db: Session) -> Chapter:
    """Récupère un chapitre appartenant à l'utilisateur ou lève une 404."""
    chapter = (
        db.query(Chapter)
        .options(selectinload(Chapter.manuscript))
        .filter(Chapter.id == chapter_id, Chapter.user_id == user_id)
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapitre introuvable")
    return chapter


@router.post("/", response_model=ManuscriptSchema, status_code=status.HTTP_201_CREATED)
def create_manuscript(
    manuscript: ManuscriptCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    db_manuscript = Manuscript(**manuscript.dict(), user_id=user.id)
    db.add(db_manuscript)
    db.commit()
    db.refresh(db_manuscript)
    return db_manuscript


@router.get("/", response_model=list[ManuscriptSchema])
def list_manuscripts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(Manuscript)
        .options(selectinload(Manuscript.chapters))
        .filter(Manuscript.user_id == user.id)
        .order_by(Manuscript.created_at.desc())
        .all()
    )


@router.get("/{manuscript_id}", response_model=ManuscriptSchema)
def get_manuscript(manuscript_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return _get_user_manuscript_or_404(manuscript_id, user.id, db)


@router.patch("/{manuscript_id}", response_model=ManuscriptSchema)
def update_manuscript(
    manuscript_id: int,
    manuscript_update: ManuscriptUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    manuscript = _get_user_manuscript_or_404(manuscript_id, user.id, db)
    update_data = manuscript_update.dict(exclude_unset=True, exclude_none=True)
    for field, value in update_data.items():
        setattr(manuscript, field, value)
    db.commit()
    db.refresh(manuscript)
    return manuscript


@router.delete("/{manuscript_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_manuscript(manuscript_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    manuscript = _get_user_manuscript_or_404(manuscript_id, user.id, db)
    db.delete(manuscript)
    db.commit()


@router.post("/{manuscript_id}/share", status_code=status.HTTP_202_ACCEPTED)
def share_manuscript(
    manuscript_id: int,
    payload: ManuscriptShareRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Partage un manuscrit par email avec PDF en pièce jointe."""
    manuscript = _get_user_manuscript_or_404(manuscript_id, user.id, db)
    if not payload.recipients:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ajoute au moins un destinataire")

    if payload.chapter_ids:
        requested_ids = set(payload.chapter_ids)
        chapters = [chapter for chapter in manuscript.chapters if chapter.id in requested_ids]
        if len(chapters) != len(requested_ids):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapitre introuvable dans ce manuscrit")
    else:
        chapters = manuscript.chapters

    if not chapters:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun chapitre à partager")

    subject = payload.subject or f"{manuscript.title} – partage de manuscrit"
    author_name = user.username or user.email

    try:
        share_manuscript_via_email(
            manuscript=manuscript,
            chapters=chapters,
            recipients=payload.recipients,
            subject=subject,
            message=payload.message,
            author_name=author_name,
        )
    except EmailError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    return {"message": "Manuscrit envoyé"}


@router.get("/{manuscript_id}/chapters", response_model=list[ChapterSchema])
def list_chapters(manuscript_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    manuscript = _get_user_manuscript_or_404(manuscript_id, user.id, db)
    return manuscript.chapters


@router.post(
    "/{manuscript_id}/chapters",
    response_model=ChapterSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_chapter(
    manuscript_id: int,
    chapter: ChapterCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _get_user_manuscript_or_404(manuscript_id, user.id, db)
    order_index = chapter.order_index
    if order_index is None:
        last_order = (
            db.query(func.max(Chapter.order_index))
            .filter(Chapter.manuscript_id == manuscript_id)
            .scalar()
        )
        order_index = (last_order or 0) + 1

    db_chapter = Chapter(
        title=chapter.title,
        content=chapter.content,
        order_index=order_index,
        manuscript_id=manuscript_id,
        user_id=user.id,
    )
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)
    return db_chapter


@router.patch("/chapters/{chapter_id}", response_model=ChapterSchema)
def update_chapter(
    chapter_id: int,
    chapter_update: ChapterUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    chapter = _get_user_chapter_or_404(chapter_id, user.id, db)
    update_data = chapter_update.dict(exclude_unset=True, exclude_none=True)
    for field, value in update_data.items():
        setattr(chapter, field, value)
    db.commit()
    db.refresh(chapter)
    return chapter


@router.delete("/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(chapter_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    chapter = _get_user_chapter_or_404(chapter_id, user.id, db)
    db.delete(chapter)
    db.commit()


@router.get("/chapters/recent", response_model=list[ChapterWithManuscript])
def list_recent_chapters(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(Chapter)
        .options(selectinload(Chapter.manuscript))
        .filter(Chapter.user_id == user.id)
        .order_by(Chapter.created_at.desc())
        .limit(6)
        .all()
    )
