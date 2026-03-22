from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import Session
from ..schemas import LegacyStateBlob, LegacyGameEntry, LegacyStatBlock

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _orm_to_legacy_entry(s: Session) -> LegacyGameEntry:
    return LegacyGameEntry(
        skill=LegacyStatBlock(initial=s.skill_initial, current=s.skill_current),
        stamina=LegacyStatBlock(initial=s.stamina_initial, current=s.stamina_current),
        luck=LegacyStatBlock(initial=s.luck_initial, current=s.luck_current),
    )


@router.get("/state", response_model=LegacyStateBlob)
def get_state(db: DBSession = Depends(get_db)):
    sessions = db.query(Session).all()
    if not sessions:
        return LegacyStateBlob()

    games = {str(s.book_number): _orm_to_legacy_entry(s) for s in sessions}
    # currentBook is the most recently updated session
    current = max(sessions, key=lambda s: s.updated_at)
    return LegacyStateBlob(games=games, currentBook=current.book_number)


@router.put("/state")
def put_state(blob: LegacyStateBlob, db: DBSession = Depends(get_db)):
    now = _now()

    for book_str, entry in blob.games.items():
        book_number = int(book_str)
        session = db.query(Session).filter(Session.book_number == book_number).first()
        if session:
            session.skill_initial = entry.skill.initial
            session.skill_current = entry.skill.current
            session.stamina_initial = entry.stamina.initial
            session.stamina_current = entry.stamina.current
            session.luck_initial = entry.luck.initial
            session.luck_current = entry.luck.current
            # Only touch updated_at for currentBook to track recency
            if blob.currentBook == book_number:
                session.updated_at = now
        else:
            session = Session(
                book_number=book_number,
                skill_initial=entry.skill.initial,
                skill_current=entry.skill.current,
                stamina_initial=entry.stamina.initial,
                stamina_current=entry.stamina.current,
                luck_initial=entry.luck.initial,
                luck_current=entry.luck.current,
            )
            if blob.currentBook == book_number:
                session.updated_at = now
            db.add(session)

    db.commit()
    return {"success": True}
