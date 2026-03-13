import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.passwords import validate_password_policy
from app.core.security import (
    create_csrf_token,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_refresh_token_from_request,
    hash_password,
    hash_token,
    set_auth_cookies,
    clear_auth_cookies,
    set_csrf_cookie,
    verify_password,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRead
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
    new_password: str



def _generate_reset_token() -> str:
    return secrets.token_urlsafe(48)


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _issue_session(response: Response, user: User, db: Session) -> None:
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token()
    csrf_token = create_csrf_token()
    user.refresh_token_hash = hash_token(refresh_token)
    user.refresh_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        days=REFRESH_TOKEN_EXPIRE_DAYS
    )
    db.add(user)
    db.commit()
    set_auth_cookies(response, access_token, refresh_token)
    set_csrf_cookie(response, csrf_token)


def _clear_user_refresh_token(user: User | None, db: Session) -> None:
    if not user:
        return
    user.refresh_token_hash = None
    user.refresh_token_expires_at = None
    db.add(user)
    db.commit()


def _clear_session_response(status_code: int, detail: str) -> JSONResponse:
    response = JSONResponse(status_code=status_code, content={"detail": detail})
    clear_auth_cookies(response)
    return response


@router.post("/login")
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    _issue_session(response, user, db)
    return {"message": "Connexion réussie"}


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/refresh")
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_refresh_token = get_refresh_token_from_request(request)
    if not raw_refresh_token:
        return _clear_session_response(status.HTTP_401_UNAUTHORIZED, "Session expirée")

    token_hash = hash_token(raw_refresh_token)
    user = (
        db.query(User)
        .filter(User.refresh_token_hash == token_hash)
        .first()
    )

    if (
        not user
        or not user.refresh_token_expires_at
        or user.refresh_token_expires_at < datetime.now(timezone.utc).replace(tzinfo=None)
    ):
        if user:
            _clear_user_refresh_token(user, db)
        return _clear_session_response(status.HTTP_401_UNAUTHORIZED, "Session expirée")

    if not user.is_active:
        _clear_user_refresh_token(user, db)
        return _clear_session_response(status.HTTP_403_FORBIDDEN, "Compte désactivé")

    _issue_session(response, user, db)
    return {"message": "Session rafraîchie"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_refresh_token = get_refresh_token_from_request(request)
    if raw_refresh_token:
        token_hash = hash_token(raw_refresh_token)
        user = db.query(User).filter(User.refresh_token_hash == token_hash).first()
        if user:
            _clear_user_refresh_token(user, db)
    clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT


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
    validate_password_policy(request.new_password)
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
    user.refresh_token_hash = None
    user.refresh_token_expires_at = None

    db.commit()

    return {"message": "Mot de passe mis à jour avec succès"}
