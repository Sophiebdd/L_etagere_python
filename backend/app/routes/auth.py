import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, constr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token, hash_password
from app.services.email import send_email, EmailError

RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:5173")

router = APIRouter(prefix="/auth", tags=["Auth"])

# --- nouveau schéma pour JSON ---
class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: constr(min_length=8)



def _generate_reset_token() -> str:
    return secrets.token_urlsafe(48)


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        # Toujours répondre positivement pour éviter la collecte d'emails.
        return {"message": "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé."}

    raw_token = _generate_reset_token()
    user.reset_token_hash = _hash_reset_token(raw_token)
    user.reset_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        minutes=RESET_TOKEN_EXPIRE_MINUTES
    )

    reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={raw_token}"
    html_content = f"""
        <p>Bonjour {user.username},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe pour L'Étagère.</p>
        <p><a href="{reset_link}">Cliquez ici pour définir un nouveau mot de passe.</a></p>
        <p>Ce lien expirera dans {RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    """

    try:
        send_email(
            recipients=[user.email],
            subject="Réinitialisation de votre mot de passe",
            html_content=html_content,
        )
    except EmailError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Impossible d'envoyer l'email de réinitialisation") from exc

    db.commit()

    return {"message": "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = _hash_reset_token(request.token)
    user = (
        db.query(User)
        .filter(User.reset_token_hash == token_hash)
        .first()
    )

    if (
        not user
        or not user.reset_token_expires_at
        or user.reset_token_expires_at < datetime.now(timezone.utc).replace(tzinfo=None)
    ):
        raise HTTPException(status_code=400, detail="Lien de réinitialisation invalide ou expiré")

    user.hashed_password = hash_password(request.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None

    db.commit()

    return {"message": "Mot de passe mis à jour avec succès"}
