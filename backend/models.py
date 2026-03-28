from datetime import datetime, timezone
from sqlalchemy import Column, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
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
    mechanics_json = Column(Text, nullable=True, default='{}')
    name = Column(Text, nullable=True)

    logs = relationship("ActionLog", back_populates="session", cascade="all, delete-orphan")


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(Text, nullable=False)
    details = Column(Text, nullable=False)  # JSON blob
    created_at = Column(Text, nullable=False, default=_now)

    session = relationship("Session", back_populates="logs")
