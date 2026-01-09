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

    model_config = ConfigDict(from_attributes=True)
