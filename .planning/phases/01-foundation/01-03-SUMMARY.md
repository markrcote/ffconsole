---
phase: 01-foundation
plan: 03
subsystem: infra
tags: [javascript, es-modules, refactoring, storage, sessions-api]

# Dependency graph
requires:
  - phase: 01-foundation-plan-01
    provides: "Backend sessions API with mechanics_json column; PUT /api/sessions/{book}"
provides:
  - "storage.js using /api/sessions (GET list, PUT upsert) with mechanics field"
  - "js/ui/stats.js module with renderStat, renderStats, bindStatEvents exports"
  - "app.js as orchestrator delegating stat rendering to ui/stats.js"
  - "UI stubs: ui/charCreate.js, ui/battle.js, ui/diceRoller.js"
  - "mechanics: {} in all selectBook() game construction sites"
affects: [phase-02-character, phase-03-battle, phase-05-books]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ui/* modules receive state and callbacks as arguments — no imports of app.js (D-17)"
    - "storage.js derives currentBook from updated_at ordering across session list"
    - "Long-press bonus stat increase logic lives in ui/stats.js, not app.js"

key-files:
  created:
    - js/ui/stats.js
    - js/ui/charCreate.js
    - js/ui/battle.js
    - js/ui/diceRoller.js
  modified:
    - js/storage.js
    - js/app.js

key-decisions:
  - "ui/*.js modules never import app.js — they receive state and callbacks as arguments to avoid circular dependencies"
  - "storage.js only PUTs the current book session on save, not all games (matches mechanics.js single-session pattern)"
  - "currentBook derived from updated_at ordering on GET /api/sessions response"

patterns-established:
  - "UI module pattern: export function fn(state, callbacks) — no coupling to app.js"
  - "Stat binding delegation: bindEvents() calls bindStatEvents(state, { onModify: modifyStat })"

requirements-completed: [INFRA-01, INFRA-03]

# Metrics
duration: 15min
completed: 2026-03-29
---

# Phase 01 Plan 03: Storage Migration and UI Module Split Summary

**storage.js migrated to /api/sessions with mechanics field; app.js refactored to delegate stat rendering to ui/stats.js with no circular imports**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T00:00:00Z
- **Completed:** 2026-03-29T00:15:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- storage.js now uses `GET /api/sessions` and `PUT /api/sessions/{book}` with mechanics field — no references to the deleted /api/state compat endpoint
- app.js bindEvents() replaced 37-line inline forEach with single `bindStatEvents(state, { onModify: modifyStat })` call
- ui/stats.js extracted with renderStat, renderStats, bindStatEvents exports; no app.js import (D-17 compliant)
- Three Phase 2/3 UI stubs created (charCreate, battle, diceRoller) as export shells
- All selectBook() game construction sites include mechanics: {} — state shape matches API schema

## Task Commits

1. **Task 1: Migrate storage.js to /api/sessions** - `4ef2387` (feat)
2. **Task 2: Extract ui/stats.js, create UI stubs, fix bindEvents delegation** - `437e19d` (feat)

## Files Created/Modified

- `js/storage.js` - Rewritten to use /api/sessions; save() PUTs current book only; load() maps session list to games/currentBook shape
- `js/app.js` - Removed inline stat binding forEach; imports renderStats/renderStat/bindStatEvents from ui/stats.js; mechanics: {} in selectBook new-game construction
- `js/ui/stats.js` - New module: renderStat, renderStats, bindStatEvents with long-press hold logic
- `js/ui/charCreate.js` - New stub: showCharCreate export for Phase 2
- `js/ui/battle.js` - New stub: renderBattle export for Phase 3
- `js/ui/diceRoller.js` - New stub: renderDiceRoller export for Phase 2

## Decisions Made

- ui/*.js modules receive state and callbacks as arguments rather than importing app.js — eliminates circular dependency risk (D-17)
- storage.js only PUTs the currentBook session on each save call, not all games — matches single-session pattern from mechanics.js
- currentBook is derived from updated_at ordering on the GET /api/sessions response, so device-switching always returns to the most recent session

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale renderStat('luck') call missing state argument**
- **Found during:** Task 2 (updating app.js)
- **Issue:** app.js line 389 had `renderStat('luck')` with no state argument — would throw at runtime in the offline luck test fallback path since the imported renderStat(name, state) requires state
- **Fix:** Changed to `renderStat('luck', state)`
- **Files modified:** js/app.js
- **Verification:** Grep confirms `renderStat('luck', state)` present, no bare `renderStat('luck')` calls remain
- **Committed in:** 437e19d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary correctness fix for offline luck test path. No scope creep.

## Known Stubs

The following intentional stubs exist as empty shells for future phases:

| File | Export | Reason |
|------|--------|--------|
| `js/ui/charCreate.js` | `showCharCreate` | Phase 2 implementation |
| `js/ui/battle.js` | `renderBattle` | Phase 3 implementation |
| `js/ui/diceRoller.js` | `renderDiceRoller` | Phase 2 implementation |

These stubs are intentional scaffolding. They do not block the current plan's goal (storage migration and app.js modularization). Each will be wired in the phase noted.

## Issues Encountered

None — app.js already had the import and most of the target state from a partial previous execution. Task 2 focused on replacing the inline stat binding forEach and fixing the stale renderStat call.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- storage.js is aligned with the sessions API; all saves include mechanics field
- app.js is a clean orchestrator — stat rendering logic lives in ui/stats.js
- Phase 2 can implement showCharCreate and renderDiceRoller in existing stub files
- Phase 3 can implement renderBattle in existing stub file
- No blockers for next phase

## Self-Check: PASSED

All files verified present on disk. Both task commits (4ef2387, 437e19d) confirmed in git history.

---
*Phase: 01-foundation*
*Completed: 2026-03-29*
