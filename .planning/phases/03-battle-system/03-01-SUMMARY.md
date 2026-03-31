---
phase: 03-battle-system
plan: 01
subsystem: api
tags: [fastapi, sqlalchemy, combat, stamina, flee]

# Dependency graph
requires:
  - phase: 02-core-mechanics
    provides: actions router with luck_test and combat_round handlers
provides:
  - Flee combat Stamina penalty persisted server-side via combat_end handler
affects: [battle-system, frontend-combat, device-switching]

# Tech tracking
tech-stack:
  added: []
  patterns: [action_type elif chain for stat mutations in post_action]

key-files:
  created: []
  modified:
    - backend/routers/actions.py

key-decisions:
  - "Reuse combat_end action type (not a new combat_flee type) — matches existing app.js POST payload"
  - "max(0, stamina_current - 2) guard consistent with combat_round/enemy_hit pattern"

patterns-established:
  - "Stat mutation pattern: elif body.action_type == X -> read details -> apply max(0, ...) guard -> update updated_at"

requirements-completed: [BATTLE-05]

# Metrics
duration: 3min
completed: 2026-03-30
---

# Phase 03 Plan 01: Flee Stamina Penalty Summary

**Flee combat now deducts 2 Stamina server-side atomically via combat_end handler, preventing stat divergence on device switch or reload**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-30T00:00:00Z
- **Completed:** 2026-03-30T00:03:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `combat_end` elif branch to `post_action` in `backend/routers/actions.py`
- Flee penalty (2 Stamina) applied atomically with the ActionLog insert
- `max(0, ...)` guard prevents negative Stamina — consistent with existing `combat_round` pattern
- Non-flee combat_end (winner = "player" or "enemy") correctly leaves Stamina unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add flee Stamina deduction to combat_end handler** - `70df231` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `backend/routers/actions.py` - Added elif branch for combat_end/fled; 5 lines added

## Decisions Made
- Reused `combat_end` action type rather than introducing a new `combat_flee` type — matches existing app.js `endCombat(currentBook, 'fled', ...)` call at line 492
- Pattern exactly mirrors `combat_round` / `enemy_hit` handler for code consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Flee penalty is now persisted server-side; plans 02–05 can proceed with full combat system frontend
- No blockers for the remaining battle-system plans

## Self-Check: PASSED

- `backend/routers/actions.py` — FOUND
- `.planning/phases/03-battle-system/03-01-SUMMARY.md` — FOUND
- Commit `70df231` — FOUND

---
*Phase: 03-battle-system*
*Completed: 2026-03-30*
