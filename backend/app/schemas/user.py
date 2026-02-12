from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

# Schéma utilisé pour créer un utilisateur
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# Schéma utilisé pour renvoyer un utilisateur (sans mot de passe)
class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_admin: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class UserAdminRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_admin: bool
    is_active: bool
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class UserStatusUpdate(BaseModel):
    is_active: bool
