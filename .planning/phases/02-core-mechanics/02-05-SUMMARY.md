---
phase: 02-core-mechanics
plan: "05"
subsystem: ui
tags: [vanilla-js, html, charCreate, diceRoller, luck-test, character-name]

# Dependency graph
requires:
  - phase: 02-core-mechanics-01
    provides: backend name field in session API
  - phase: 02-core-mechanics-02
    provides: CSS classes for die-face, luck-result, char-name, dice-roller
  - phase: 02-core-mechanics-03
    provides: showCharCreate() implementation in js/ui/charCreate.js
  - phase: 02-core-mechanics-04
    provides: renderDiceRoller() implementation in js/ui/diceRoller.js
provides:
  - index.html wired with #char-name, #luck-result, #dice-section elements
  - app.js showCharCreate replacing showBookModal for New Adventure and first-load
  - _applyNewCharacter() helper persisting stats + name to backend
  - renderCharName() displaying character name below book title
  - Luck test handler upgraded with die faces, Lucky/Unlucky label, 800ms debounce
  - renderDiceRoller() initialized from init() on page load
affects: [phase-03-combat, phase-04-book-mechanics, 01-foundation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "showCharCreate called with { games, currentBook, save, onComplete } — no circular imports"
    - "_applyNewCharacter centralizes new-session state mutation and re-render"
    - "Cosmetic dice for luck test display rolled locally; testLuck() uses own internal roll (documented accepted mismatch)"

key-files:
  created: []
  modified:
    - index.html
    - js/app.js

key-decisions:
  - "Cosmetic dice for luck display rolled locally (d1+d2 in handler); testLuck() rolls independently — both random, game correctness unaffected (Research Risk 1 mitigation)"
  - "renderCharName() hides element entirely when state.name is null (classList remove 'visible'), no empty space"
  - "_applyNewCharacter() sets state.name = null when name is falsy, letting display layer decide empty treatment"
  - "Luck test button disabled immediately on click, re-enabled via setTimeout 800ms per UI-SPEC"

patterns-established:
  - "Phase 2 UI modules receive state + callbacks as function parameters, never import app.js"
  - "New character flow: showCharCreate({games,currentBook,save,onComplete}) -> _applyNewCharacter -> render()"

requirements-completed: [CHAR-01, CHAR-02, CHAR-03, CHAR-04, CHAR-05, LUCK-01, LUCK-02, LUCK-03, DICE-01, DICE-02]

# Metrics
duration: 2min
completed: 2026-03-29
---

# Phase 2 Plan 5: Wiring — index.html + app.js Integration Summary

**All Phase 2 features wired into index.html and app.js: showCharCreate replaces showBookModal, die-face luck test display, char name rendering, and dice roller initialization**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T19:33:48Z
- **Completed:** 2026-03-29T19:35:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `#char-name`, `#luck-result`, and `#dice-section` HTML elements in correct positions in index.html
- Replaced both `showBookModal` call sites in app.js with `showCharCreate` (first-load path + "New Adventure" handler)
- Added `_applyNewCharacter()` to centralize new session creation with name field
- Added `renderCharName()` and wired it into `render()` so name persists visibly below book title
- Upgraded luck test handler with two die face bubbles, "Lucky!"/"Unlucky." label, footnote, and 800ms button debounce
- Added `renderDiceRoller(diceSection)` call in `init()` so dice widget populates on page load

## Task Commits

1. **Task 1: Add Phase 2 HTML elements to index.html** - `2daab55` (feat)
2. **Task 2: Update app.js — imports, new-game handler, luck display, char name, dice roller init** - `6ada889` (feat)

## Files Created/Modified

- `index.html` - Added #char-name after #book-title, #luck-result after #tests-result, #dice-section between tests and combat sections
- `js/app.js` - New imports, showCharCreate wiring, _applyNewCharacter helper, renderCharName helper, upgraded luck handler

## Decisions Made

- Cosmetic dice for luck display are rolled locally in the handler (d1+d2); `testLuck()` uses its own independent internal roll. Both are random; game correctness is unaffected. Documented in code comments per Research Risk 1 mitigation.
- `renderCharName()` uses a `visible` CSS class toggle to hide/show the element cleanly with no empty space when no name is set (D-14).
- `_applyNewCharacter()` stores `name: name || null` — null stored as null, display layer decides treatment.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 2 features are fully wired and operational
- Complete adventure sheet flow: character creation modal → stats displayed → name shown → luck tests with die faces → standalone dice roller
- Phase 3 (Combat) can proceed; no blockers from Phase 2 wiring

## Self-Check

- [x] `index.html` has 3 new elements: #char-name (line 14), #luck-result (line 69), #dice-section (line 72)
- [x] `js/app.js` has showCharCreate at 3 locations (import + init + new-game handler)
- [x] `js/app.js` has renderCharName at 2 locations (definition + render() call)
- [x] `js/app.js` has renderDiceRoller at 2 locations (import + init call)
- [x] Commits 2daab55 and 6ada889 exist

---
*Phase: 02-core-mechanics*
*Completed: 2026-03-29*
