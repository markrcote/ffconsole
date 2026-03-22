from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text
from .database import Base


def _now():
    return datetime.now(timezone.utc).isoformat()


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_number = Column(Integer, nullable=False, unique=True, index=True)
    created_at = Column(Text, nullable=False, default=_now)
    updated_at = Column(Text, nullable=False, default=_now, onupdate=_now)

    skill_initial = Column(Integer, nullable=False)
    skill_current = Column(Integer, nullable=False)
    stamina_initial = Column(Integer, nullable=False)
    stamina_current = Column(Integer, nullable=False)
    luck_initial = Column(Integer, nullable=False)
    luck_current = Column(Integer, nullable=False)
