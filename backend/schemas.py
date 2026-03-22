from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Any


class StatBlock(BaseModel):
    initial: int = Field(..., ge=0)
    current: int = Field(..., ge=0)


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_number: int
    created_at: str
    updated_at: str
    skill: StatBlock
    stamina: StatBlock
    luck: StatBlock

    @model_validator(mode="before")
    @classmethod
    def assemble_stat_blocks(cls, data: Any) -> Any:
        # When constructing from an ORM object, map flat columns to StatBlock dicts
        if hasattr(data, "__tablename__"):
            return {
                "id": data.id,
                "book_number": data.book_number,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
                "skill": {"initial": data.skill_initial, "current": data.skill_current},
                "stamina": {"initial": data.stamina_initial, "current": data.stamina_current},
                "luck": {"initial": data.luck_initial, "current": data.luck_current},
            }
        return data


class SessionCreate(BaseModel):
    book_number: int = Field(..., ge=1)
    skill: StatBlock
    stamina: StatBlock
    luck: StatBlock


class SessionUpdate(BaseModel):
    skill: StatBlock | None = None
    stamina: StatBlock | None = None
    luck: StatBlock | None = None


# Compat shim — mirrors the exact shape that storage.js sends and expects
class LegacyStatBlock(BaseModel):
    initial: int
    current: int


class LegacyGameEntry(BaseModel):
    skill: LegacyStatBlock
    stamina: LegacyStatBlock
    luck: LegacyStatBlock


class LegacyStateBlob(BaseModel):
    games: dict[str, LegacyGameEntry] = {}
    currentBook: int | None = None


class ActionRequest(BaseModel):
    action_type: str
    details: dict[str, Any]


class ActionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    action_type: str
    details: dict[str, Any]
    created_at: str

    @model_validator(mode="before")
    @classmethod
    def parse_details(cls, data: Any) -> Any:
        if hasattr(data, "__tablename__"):
            import json
            return {
                "id": data.id,
                "session_id": data.session_id,
                "action_type": data.action_type,
                "details": json.loads(data.details),
                "created_at": data.created_at,
            }
        return data


class ActionResult(BaseModel):
    session: SessionResponse
    log: ActionLogResponse
