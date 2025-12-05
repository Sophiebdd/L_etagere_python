from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    books = relationship("Book", back_populates="user")
    manuscripts = relationship(
        "Manuscript",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    chapters = relationship(
        "Chapter",
        back_populates="author",
        cascade="all, delete-orphan",
    )
