import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import Session
from ..schemas import SessionCreate, SessionResponse, SessionUpdate

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/sessions", response_model=list[SessionResponse])
def list_sessions(db: DBSession = Depends(get_db)):
    return db.query(Session).order_by(Session.book_number).all()


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(body: SessionCreate, db: DBSession = Depends(get_db)):
    existing = db.query(Session).filter(Session.book_number == body.book_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Session for book {body.book_number} already exists. Use PUT to update.",
        )
    session = Session(
        book_number=body.book_number,
        skill_initial=body.skill.initial,
        skill_current=body.skill.current,
        stamina_initial=body.stamina.initial,
        stamina_current=body.stamina.current,
        luck_initial=body.luck.initial,
        luck_current=body.luck.current,
        mechanics_json=json.dumps(body.mechanics or {}),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{book_number}", response_model=SessionResponse)
def get_session(book_number: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.book_number == book_number).first()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session for book {book_number} not found.")
    return session


@router.put("/sessions/{book_number}", response_model=SessionResponse)
def upsert_session(book_number: int, body: SessionCreate, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.book_number == book_number).first()
    if session:
        session.skill_initial = body.skill.initial
        session.skill_current = body.skill.current
        session.stamina_initial = body.stamina.initial
        session.stamina_current = body.stamina.current
        session.luck_initial = body.luck.initial
        session.luck_current = body.luck.current
        session.mechanics_json = json.dumps(body.mechanics or {})
        session.name = body.name
        session.updated_at = _now()
    else:
        session = Session(
            book_number=book_number,
            name=body.name,
            skill_initial=body.skill.initial,
            skill_current=body.skill.current,
            stamina_initial=body.stamina.initial,
            stamina_current=body.stamina.current,
            luck_initial=body.luck.initial,
            luck_current=body.luck.current,
            mechanics_json=json.dumps(body.mechanics or {}),
        )
        db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/sessions/{book_number}", response_model=SessionResponse)
def patch_session(book_number: int, body: SessionUpdate, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.book_number == book_number).first()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session for book {book_number} not found.")
    if body.skill is not None:
        session.skill_initial = body.skill.initial
        session.skill_current = body.skill.current
    if body.stamina is not None:
        session.stamina_initial = body.stamina.initial
        session.stamina_current = body.stamina.current
    if body.luck is not None:
        session.luck_initial = body.luck.initial
        session.luck_current = body.luck.current
    if body.mechanics is not None:
        session.mechanics_json = json.dumps(body.mechanics)
    if body.name is not None:
        session.name = body.name
    session.updated_at = _now()
    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{book_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(book_number: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.book_number == book_number).first()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session for book {book_number} not found.")
    db.delete(session)
    db.commit()
