from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class ManuscriptSummary(BaseModel):
    id: int
    title: str

    model_config = ConfigDict(from_attributes=True)


class ChapterBase(BaseModel):
    title: str
    content: str
    order_index: Optional[int] = None


class ChapterCreate(ChapterBase):
    """Payload utilisé pour créer un chapitre."""


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order_index: Optional[int] = None


class Chapter(ChapterBase):
    id: int
    manuscript_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChapterWithManuscript(Chapter):
    manuscript: Optional[ManuscriptSummary] = None


class ManuscriptBase(BaseModel):
    title: str
    description: Optional[str] = None


class ManuscriptCreate(ManuscriptBase):
    """Payload utilisé pour créer un manuscrit."""


class ManuscriptUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class Manuscript(ManuscriptBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    chapters: List[Chapter] = []

    model_config = ConfigDict(from_attributes=True)


class ManuscriptShareRequest(BaseModel):
    recipients: List[EmailStr]
    chapter_ids: Optional[List[int]] = None
    subject: Optional[str] = None
    message: Optional[str] = None
