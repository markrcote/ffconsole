---
phase: 02-core-mechanics
plan: "01"
subsystem: api
tags: [fastapi, pydantic, sqlalchemy, sessions, character-name]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Session ORM model with name column already present
provides:
  - name field exposed in SessionCreate, SessionResponse, SessionUpdate schemas
  - PUT /api/sessions/{book} writes and returns name
  - PATCH /api/sessions/{book} updates name when provided
  - GET /api/sessions/{book} returns name via assemble_stat_blocks validator
affects: [02-core-mechanics, frontend character creation, compat shim]

# Tech tracking
tech-stack:
  added: []
  patterns:
  - "Optional fields as str | None = None with default None in Pydantic schemas"
  - "assemble_stat_blocks model_validator maps ORM flat columns to structured response"

key-files:
  created: []
  modified:
    - backend/schemas.py
    - backend/routers/sessions.py

key-decisions:
  - "name added as last field in each schema class to match plan spec and minimize diff"

patterns-established:
  - "Schema additions follow append-last pattern within each class"

requirements-completed: [CHAR-03]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 02 Plan 01: Backend — Expose `name` in Session API Summary

**`name` field wired through full Pydantic schema and session PUT/PATCH pipeline so character names persist to SQLite via /api/sessions**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-29T19:06:35Z
- **Completed:** 2026-03-29T19:07:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `name: str | None = None` to `SessionCreate`, `SessionResponse`, and `SessionUpdate` Pydantic schemas
- Updated `assemble_stat_blocks` model validator in `SessionResponse` to populate `name` from the ORM object
- `upsert_session` PUT handler writes `body.name` in both the update branch and the `Session(...)` constructor
- `patch_session` PATCH handler conditionally sets `session.name = body.name` when provided
- Verified all four operations (PUT with name, PATCH rename, GET returns name, PUT with null name) work correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Add `name` to Pydantic schemas** - `2dc3c58` (feat)
2. **Task 2: Write `name` in upsert and patch handlers** - `3421a17` (feat)

## Files Created/Modified

- `backend/schemas.py` - Added `name: str | None = None` to three schema classes; updated validator to include name in ORM-to-dict mapping
- `backend/routers/sessions.py` - Added name write in upsert update branch, upsert create branch (Session constructor), and patch handler

## Decisions Made

None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend now accepts and returns `name` on all session read/write operations
- Frontend character creation flow (Phase 02 plans 02+) can now send `name` in PUT/PATCH requests and read it back
- GET /api/sessions list also returns name per session via the updated SessionResponse schema

---
*Phase: 02-core-mechanics*
*Completed: 2026-03-29*
