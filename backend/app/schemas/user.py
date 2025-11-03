from pydantic import BaseModel, EmailStr

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

    class Config:
        orm_mode = True
