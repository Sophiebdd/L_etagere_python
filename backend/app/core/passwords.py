import re

from fastapi import HTTPException


PASSWORD_POLICY_MESSAGE = (
    "Le mot de passe doit contenir au moins 8 caracteres, une minuscule, une majuscule et un chiffre"
)

_LOWERCASE_RE = re.compile(r"[a-z]")
_UPPERCASE_RE = re.compile(r"[A-Z]")
_DIGIT_RE = re.compile(r"\d")


def validate_password_policy(password: str) -> str:
    if (
        len(password) < 8
        or not _LOWERCASE_RE.search(password)
        or not _UPPERCASE_RE.search(password)
        or not _DIGIT_RE.search(password)
    ):
        raise HTTPException(status_code=400, detail=PASSWORD_POLICY_MESSAGE)
    return password
