---
phase: 06-module-restructure-and-dom-cleanup
plan: 01
subsystem: ui
tags: [vanilla-js, battle, dom, refactor, container-scoped]

# Dependency graph
requires:
  - phase: 05-luck-in-combat
    provides: battle.js with luck-in-combat testing integrated

provides:
  - Container-scoped battle.js with zero global document.getElementById() calls
  - renderBattle(container, getState, callbacks, historyContainer) 4-arg signature
  - updateStaminaBars(container, ...) with container as first arg

affects:
  - 06-02 (battleModal.js can now pass any container to renderBattle)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Container-scoped DOM queries: all battle.js lookups use container.querySelector() instead of document.getElementById()"
    - "historyContainer as optional 4th arg: renderBattle accepts external container for history panel (outside combat container)"

key-files:
  created: []
  modified:
    - js/ui/battle.js
    - js/app.js

key-decisions:
  - "historyContainer passed as 4th arg to renderBattle() rather than queried inside the function — history panel lives outside the combat container in the DOM"
  - "app.js updated to pass historyContainer as 4th arg to renderBattle() — existing inline panel still works with no index.html changes"

patterns-established:
  - "Container-scoped pattern: all UI module DOM queries scoped to container arg, not global document"

requirements-completed: [MODAL-02, MODAL-03]

# Metrics
duration: 5min
completed: 2026-04-03
---

# Phase 06 Plan 01: Module Restructure - Battle.js DOM Scoping Summary

**battle.js fully container-scoped: all 19 document.getElementById() calls replaced with container.querySelector() / historyContainer.querySelector(), enabling modal reuse in Plan 02**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-03T15:03:34Z
- **Completed:** 2026-04-03T15:06:51Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Eliminated all `document.getElementById()` calls from battle.js (19 total removed)
- `updateStaminaBars()` now takes `container` as first parameter with all 4 call sites updated
- `renderBattle()` now accepts optional `historyContainer` as 4th argument
- `loadCombatHistory()` toggle/list queries scoped to `historyContainer.querySelector()`
- `summaryEl.querySelector('#new-battle')` replaces global lookup for new-battle button
- `app.js` updated to pass `historyContainer` as 4th arg to `renderBattle()` — inline panel still works

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate all document.getElementById() calls to container-scoped queries** - `fd158ba` (refactor)

**Plan metadata:** (docs commit pending)

## Files Created/Modified
- `js/ui/battle.js` - All DOM queries scoped to container/historyContainer args; zero getElementById calls remain
- `js/app.js` - Updated renderBattle() call to pass historyContainer as 4th argument

## Decisions Made
- `historyContainer` is passed as an optional 4th argument to `renderBattle()` rather than being queried inside the function. This is necessary because the history panel (`#combat-history`) lives outside the `.combat-section` container in the DOM, so it cannot be found via `container.querySelector()`.
- `app.js` updated so `historyContainer` is resolved once and passed to both `renderBattle()` (for inline history refresh after battles) and the initial history load is handled by `renderBattle()` itself at init time — the separate `loadCombatHistory()` call in `app.js` was removed since `renderBattle()` now handles that on init.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `battle.js` is fully container-scoped: `renderBattle()` can now be called with any container element (inline panel or modal div)
- Plan 02 can create `battleModal.js` and pass a modal `<div>` as the container to `renderBattle()` without any further battle.js changes
- No index.html changes were needed — existing inline combat panel continues working with identical behavior

---
*Phase: 06-module-restructure-and-dom-cleanup*
*Completed: 2026-04-03*
