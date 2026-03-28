---
phase: 01-foundation
plan: 01
subsystem: api, database
tags: [fastapi, sqlalchemy, sqlite, pydantic, mechanics-json]

# Dependency graph
requires: []
provides:
  - Session model with mechanics_json TEXT column and name TEXT column
  - All session CRUD endpoints accept and return mechanics dict
  - Compat layer removed (/api/state, Legacy* schemas, compat.py)
  - Database recreates with clean schema on startup (drop_all + create_all)
affects: [01-02, 01-03, phase-02, phase-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "mechanics stored as JSON blob (TEXT column) in SQLite, deserialized in model_validator"
    - "SessionResponse.assemble_stat_blocks model_validator maps flat ORM columns to nested Pydantic shape"

key-files:
  created: []
  modified:
    - backend/models.py
    - backend/schemas.py
    - backend/main.py
    - backend/routers/sessions.py
    - backend/database.py
  deleted:
    - backend/routers/compat.py

key-decisions:
  - "mechanics stored as TEXT JSON blob (not as a separate table) — open-ended dict, no schema enforcement needed"
  - "name column added to Session model now to avoid second DB recreate in Phase 2"
  - "drop_all in init_db() ensures clean schema migration during Phase 1 development"

patterns-established:
  - "mechanics_json = json.dumps(body.mechanics or {}) in all write paths"
  - "mechanics: json.loads(data.mechanics_json or '{}') in SessionResponse.assemble_stat_blocks"

requirements-completed: [INFRA-01]

# Metrics
duration: 6min
completed: 2026-03-28
---

# Phase 01 Plan 01: Backend Mechanics Foundation Summary

**FastAPI Session model extended with mechanics_json TEXT column; compat layer fully deleted; all CRUD endpoints now persist and return open-ended mechanics dict**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-28T22:02:49Z
- **Completed:** 2026-03-28T22:09:00Z
- **Tasks:** 2
- **Files modified:** 5 (+ 1 deleted)

## Accomplishments
- Added `mechanics_json` TEXT column and `name` TEXT column to Session ORM model
- Updated all Pydantic schemas (SessionCreate, SessionUpdate, SessionResponse) to carry `mechanics: dict` field with proper JSON encode/decode
- Deleted compat layer entirely: compat.py removed, Legacy* schema classes removed, compat router unregistered from main.py
- Updated all four write paths in sessions router (POST create, PUT upsert-update, PUT upsert-create, PATCH) to persist mechanics_json
- Updated database.py init_db() to drop_all + create_all for clean schema recreation

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Session model, update Pydantic schemas, delete compat layer** - `eb3e1e6` (feat)
2. **Task 2: Update sessions router to read/write mechanics_json, recreate DB** - `8c7402a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/models.py` - Added mechanics_json TEXT and name TEXT columns after luck_current
- `backend/schemas.py` - Added import json; mechanics field on SessionCreate/Update/Response; deleted Legacy* classes
- `backend/main.py` - Removed compat router import and registration
- `backend/routers/sessions.py` - Added import json; mechanics_json write in all 4 CRUD paths
- `backend/database.py` - Added drop_all to init_db() for clean schema recreation
- `backend/routers/compat.py` - DELETED

## Decisions Made
- Storing mechanics as TEXT JSON blob rather than a separate table — the field is open-ended per-book config, no cross-session querying needed, JSON blob is simplest
- Added `name` column while doing this DB recreate to avoid a second recreate in Phase 2 (character name is required by character creation flow)
- `drop_all` stays in init_db() for Phase 1 development; plan checker noted this needs removal after Phase 1

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Minor: Round-trip verification test initially failed when manually deleting ff.db before calling init_db() in the same Python subprocess (SQLAlchemy engine held cached connection state). Fixed by running init_db() first without pre-deleting the file — init_db() handles drop_all internally. No code change needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend ready for Plan 02 (book catalog + book selection endpoint)
- Backend ready for Plan 03 (storage.js migration from compat to sessions API)
- mechanics_json column in place for Phase 2 book-specific mechanics configs
- name column in place for Phase 2 character creation flow

---
*Phase: 01-foundation*
*Completed: 2026-03-28*

## Self-Check: PASSED

- FOUND: backend/models.py
- FOUND: backend/schemas.py
- FOUND: backend/main.py
- FOUND: backend/routers/sessions.py
- FOUND: backend/database.py
- CONFIRMED DELETED: backend/routers/compat.py
- FOUND: .planning/phases/01-foundation/01-01-SUMMARY.md
- FOUND commit: eb3e1e6 (Task 1)
- FOUND commit: 8c7402a (Task 2)
