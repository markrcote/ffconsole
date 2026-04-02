import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import ActionLog, Session
from ..schemas import ActionLogResponse, ActionRequest, ActionResult, SessionResponse

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_session_or_404(book_number: int, db: DBSession) -> Session:
    session = db.query(Session).filter(Session.book_number == book_number).first()
    if not session:
        raise HTTPException(status_code=404, detail=f"Session for book {book_number} not found.")
    return session


@router.get("/sessions/{book_number}/logs", response_model=list[ActionLogResponse])
def get_logs(book_number: int, db: DBSession = Depends(get_db)):
    session = _get_session_or_404(book_number, db)
    logs = (
        db.query(ActionLog)
        .filter(ActionLog.session_id == session.id)
        .order_by(ActionLog.id.desc())
        .all()
    )
    return logs


@router.post(
    "/sessions/{book_number}/actions",
    response_model=ActionResult,
    status_code=status.HTTP_201_CREATED,
)
def post_action(book_number: int, body: ActionRequest, db: DBSession = Depends(get_db)):
    session = _get_session_or_404(book_number, db)

    # Apply stat mutations atomically with the log insert
    if body.action_type == "luck_test":
        session.luck_current = max(0, session.luck_current - 1)
        session.updated_at = _now()
    elif body.action_type == "combat_round":
        result = body.details.get("result")
        if result == "enemy_hit":
            session.stamina_current = max(0, session.stamina_current - 2)
            session.updated_at = _now()
    elif body.action_type == "combat_end":
        winner = body.details.get("winner")
        if winner == "fled":
            session.stamina_current = max(0, session.stamina_current - 2)
            session.updated_at = _now()
    elif body.action_type == "combat_luck_test":
        context = body.details.get("context")
        damage_before = body.details.get("damage_before", 2)
        damage_after = body.details.get("damage_after", 2)
        session.luck_current = max(0, session.luck_current - 1)
        if context == "wounded":
            # Enemy hit player: adjust stamina by delta (damage_before - damage_after)
            # Lucky: damage_before=2, damage_after=1 -> delta=+1 (restore 1 stamina)
            # Unlucky: damage_before=2, damage_after=3 -> delta=-1 (deduct 1 more)
            stamina_delta = damage_before - damage_after
            session.stamina_current = max(0, session.stamina_current + stamina_delta)
        # "wounding" (player hit enemy): no server stamina change — enemy stamina is client-side
        session.updated_at = _now()

    log = ActionLog(
        session_id=session.id,
        action_type=body.action_type,
        details=json.dumps(body.details),
    )
    db.add(log)
    db.commit()
    db.refresh(session)
    db.refresh(log)

    return ActionResult(session=SessionResponse.model_validate(session), log=log)
