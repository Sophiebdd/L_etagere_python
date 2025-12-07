import base64
import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from fpdf import FPDF
from bs4 import BeautifulSoup

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
from app.services.email import EmailError, send_email

router = APIRouter(prefix="/manuscripts", tags=["Manuscripts"])


def _get_user_manuscript_or_404(manuscript_id: int, user_id: int, db: Session) -> Manuscript:
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
    chapter = (
        db.query(Chapter)
        .options(selectinload(Chapter.manuscript))
        .filter(Chapter.id == chapter_id, Chapter.user_id == user_id)
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapitre introuvable")
    return chapter


def _render_share_html(manuscript: Manuscript, chapters: list[Chapter], intro: str | None, author_name: str) -> str:
    parts = [
        "<html><body style='font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f1836;'>",
        f"<h1 style='color:#5b21b6'>{manuscript.title}</h1>",
        "<p style='margin:0 0 16px 0'>"
        f"<span style='font-weight:600;white-space:nowrap;'>Auteur·rice :</span> "
        f"<span style='white-space:nowrap;'>{author_name}</span>"
        "</p>",
    ]
    if manuscript.description:
        parts.append(f"<p style='margin-bottom:24px'><em>{manuscript.description}</em></p>")
    if intro:
        parts.append(f"<p style='background:#fdf4ff;padding:12px;border-radius:12px'>{intro}</p>")

    parts.append("<p style='margin-top:24px;font-weight:600;color:#7c3aed'>Chapitres inclus :</p>")
    parts.append("<ul style='padding-left:20px;color:#4b2b86'>")
    for chapter in chapters:
        title = chapter.title or "Chapitre"
        order_label = f"Chapitre {chapter.order_index}" if chapter.order_index is not None else "Chapitre"
        parts.append(f"<li>{order_label} · {title}</li>")
    parts.append("</ul>")
    parts.append(
        "<p style='margin-top:24px;font-size:13px;color:#6b21a8;background:#faf5ff;padding:10px;border-radius:10px'>"
        "Le manuscrit complet est joint en PDF à ce message."
        "</p>"
    )

    parts.append("</body></html>")
    return "".join(parts)


def _html_to_text(html: str) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    paragraphs: list[str] = []
    for block in soup.find_all(["h1", "h2", "h3", "p", "div", "li", "blockquote"]):
        text = block.get_text(" ", strip=True)
        if text:
            paragraphs.append(text)
        block.decompose()

    remaining = soup.get_text(" ", strip=True)
    if remaining:
        paragraphs.append(remaining)

    text = "\n\n".join(paragraphs)
    normalized = unicodedata.normalize("NFKD", text)
    return normalized


def _render_share_pdf(manuscript: Manuscript, chapters: list[Chapter], intro: str | None, author_name: str) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)

    def add_styled_page():
        pdf.add_page()
        pdf.set_fill_color(247, 241, 255)
        pdf.rect(0, 0, 210, 297, "F")
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(7, 7, 196, 283, "F")
        pdf.set_text_color(31, 24, 54)
        pdf.set_xy(15, 18)

    add_styled_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, manuscript.title, ln=True)
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 12)
    pdf.multi_cell(0, 7, f"Auteur·rice : {author_name}")
    if manuscript.description:
        pdf.ln(2)
        pdf.set_font("Helvetica", "I", 11)
        pdf.multi_cell(0, 7, manuscript.description)
        pdf.set_font("Helvetica", "", 12)
    if intro:
        pdf.ln(3)
        pdf.set_font("Helvetica", "I", 11)
        pdf.multi_cell(0, 7, intro)
        pdf.set_font("Helvetica", "", 12)
    pdf.ln(5)

    for chapter in chapters:
        add_styled_page()
        title = chapter.title or "Chapitre"
        order_label = f"Chapitre {chapter.order_index}" if chapter.order_index is not None else "Chapitre"
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(92, 30, 182)
        pdf.cell(0, 12, f"{order_label} - {title}", ln=True)
        pdf.ln(4)
        pdf.set_text_color(31, 24, 54)
        pdf.set_font("Helvetica", "", 12)
        text_content = _html_to_text(chapter.content)
        pdf.set_fill_color(255, 255, 255)
        pdf.multi_cell(0, 7, text_content or "(Chapitre vide)", border=0, fill=True)
        pdf.ln(3)

    return pdf.output(dest="S").encode("latin1")


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
    intro = payload.message.strip() if payload.message else None
    author_name = user.username or user.email
    html_content = _render_share_html(manuscript, chapters, intro, author_name)
    pdf_bytes = _render_share_pdf(manuscript, chapters, intro, author_name)
    attachment = {
        "ContentType": "application/pdf",
        "Filename": f"{manuscript.title}.pdf",
        "Base64Content": base64.b64encode(pdf_bytes).decode("ascii"),
    }

    try:
        send_email(
            recipients=payload.recipients,
            subject=subject,
            html_content=html_content,
            attachments=[attachment],
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
