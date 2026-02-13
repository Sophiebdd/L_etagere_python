from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Book(Base):
    __tablename__ = "books"
    __table_args__ = (
        UniqueConstraint("user_id", "external_id", name="uq_books_user_external_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=utcnow)
    publication_date = Column(Date, nullable=True)
    isbn = Column(String(255), nullable=True)
    cover_image = Column(String(255), nullable=True)
    external_id = Column(String(255), nullable=True)
    genre = Column(String(255), nullable=True)
    embedding = Column(JSON, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_favorite = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="books")
    notes = relationship(
        "BookNote",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="BookNote.created_at.desc()",
    )
