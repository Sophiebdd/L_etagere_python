import os
from typing import Iterable

import requests
from dotenv import load_dotenv

load_dotenv()

MAILJET_API_KEY = os.getenv("MAILJET_API_KEY")
MAILJET_SECRET_KEY = os.getenv("MAILJET_SECRET_KEY")
MAIL_FROM = os.getenv("MAIL_FROM", "contact@letagere.app")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "L'Étagère")


class EmailError(Exception):
    """Custom exception raised when an email cannot be sent."""


def send_email(
    *,
    recipients: Iterable[str],
    subject: str,
    html_content: str,
    attachments: list[dict] | None = None,
) -> None:
    if not MAILJET_API_KEY or not MAILJET_SECRET_KEY:
        raise EmailError("Configuration Mailjet manquante")

    sanitized_recipients = [email for email in recipients if email]
    if not sanitized_recipients:
        raise EmailError("Aucun destinataire valide")

    payload = {
      "Messages": [
        {
          "From": {"Email": MAIL_FROM, "Name": MAIL_FROM_NAME},
          "To": [{"Email": email, "Name": email.split("@")[0]} for email in sanitized_recipients],
          "Subject": subject,
          "HTMLPart": html_content,
        }
      ]
    }

    if attachments:
        payload["Messages"][0]["Attachments"] = attachments

    try:
        response = requests.post(
            "https://api.mailjet.com/v3.1/send",
            auth=(MAILJET_API_KEY, MAILJET_SECRET_KEY),
            json=payload,
            timeout=30,
        )
    except Exception as exc:  # pragma: no cover
        raise EmailError("Envoi d'email impossible") from exc

    if response.status_code not in (200, 201):
        detail = response.text or "Erreur d'envoi"
        raise EmailError(detail)
