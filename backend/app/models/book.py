from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    publication_date = Column(Date, nullable=True)
    isbn = Column(String(255), nullable=True)
    cover_image = Column(String(255), nullable=True)
    external_id = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_favorite = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="books")
    notes = relationship(
        "BookNote",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="BookNote.created_at.desc()",
    )
