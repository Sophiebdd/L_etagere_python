"""Service pour le partage de manuscrits : génération PDF, HTML et envoi d'emails."""

import base64
import unicodedata

from bs4 import BeautifulSoup
from fpdf import FPDF

from app.models.chapter import Chapter
from app.models.manuscript import Manuscript
from app.services.email import send_email


def html_to_text(html: str) -> str:
    """Convertit du HTML en texte brut formaté.
    
    Args:
        html: Contenu HTML à convertir
        
    Returns:
        Texte brut avec paragraphes séparés par des sauts de ligne
    """
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


def render_share_html(
    manuscript: Manuscript,
    chapters: list[Chapter],
    intro: str | None,
    author_name: str
) -> str:
    """Génère le contenu HTML pour l'email de partage.
    
    Args:
        manuscript: Manuscrit à partager
        chapters: Liste des chapitres à inclure
        intro: Message d'introduction optionnel
        author_name: Nom de l'auteur
        
    Returns:
        HTML complet formaté pour l'email
    """
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


def render_share_pdf(
    manuscript: Manuscript,
    chapters: list[Chapter],
    intro: str | None,
    author_name: str
) -> bytes:
    """Génère le PDF du manuscrit pour le partage.
    
    Args:
        manuscript: Manuscrit à convertir en PDF
        chapters: Liste des chapitres à inclure
        intro: Message d'introduction optionnel
        author_name: Nom de l'auteur
        
    Returns:
        Contenu du PDF en bytes
    """
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)

    def add_styled_page():
        """Ajoute une page avec un style cohérent."""
        pdf.add_page()
        pdf.set_fill_color(247, 241, 255)
        pdf.rect(0, 0, 210, 297, "F")
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(7, 7, 196, 283, "F")
        pdf.set_text_color(31, 24, 54)
        pdf.set_xy(15, 18)

    # Page de titre
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

    # Chapitres
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
        text_content = html_to_text(chapter.content)
        pdf.set_fill_color(255, 255, 255)
        pdf.multi_cell(0, 7, text_content or "(Chapitre vide)", border=0, fill=True)
        pdf.ln(3)

    return pdf.output(dest="S").encode("latin1")


def share_manuscript_via_email(
    manuscript: Manuscript,
    chapters: list[Chapter],
    recipients: list[str],
    subject: str,
    message: str | None,
    author_name: str
) -> None:
    """Partage un manuscrit par email avec PDF en pièce jointe.
    
    Args:
        manuscript: Manuscrit à partager
        chapters: Liste des chapitres à inclure
        recipients: Adresses email des destinataires
        subject: Sujet de l'email
        message: Message d'introduction optionnel
        author_name: Nom de l'auteur
        
    Raises:
        EmailError: Si l'envoi échoue
    """
    intro = message.strip() if message else None
    html_content = render_share_html(manuscript, chapters, intro, author_name)
    pdf_bytes = render_share_pdf(manuscript, chapters, intro, author_name)
    
    attachment = {
        "ContentType": "application/pdf",
        "Filename": f"{manuscript.title}.pdf",
        "Base64Content": base64.b64encode(pdf_bytes).decode("ascii"),
    }

    send_email(
        recipients=recipients,
        subject=subject,
        html_content=html_content,
        attachments=[attachment],
    )
