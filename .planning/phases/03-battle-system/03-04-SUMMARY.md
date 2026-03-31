---
phase: 03-battle-system
plan: 04
subsystem: ui
tags: [vanilla-js, es-modules, combat, stamina-bars, dice, history]

requires:
  - phase: 03-03
    provides: Combat section DOM elements (stamina bars, round result, summary, history IDs)
  - phase: 03-02
    provides: CSS classes for combat-round-card, combat-summary, stamina-bar, combat-log
  - phase: 03-01
    provides: mechanics.js exports (startCombat, rollCombatRound, endCombat) and /api/sessions/{book}/logs endpoint

provides:
  - renderBattle(container, getState, callbacks) — full combat lifecycle UI module
  - loadCombatHistory(bookNumber, historyContainer) — fetches and renders past battles from backend
affects:
  - 03-05 (app.js wiring — imports renderBattle, removes old combat handlers)

tech-stack:
  added: []
  patterns:
    - "battle.js receives all state via getState() and all mechanic calls via callbacks — never imports app.js"
    - "updateStaminaBars: percentage-based fill + aria-valuenow/max updates + critical class at <25%"
    - "splitRoll(total): cosmetic 2d6 individual die display from total (d1=ceil(total/2), d2=total-d1)"
    - "loadCombatHistory: fetch logs -> filter combat types -> reverse to chronological -> group by combat_start"

key-files:
  created: []
  modified:
    - js/ui/battle.js

key-decisions:
  - "All state access via getState() callback, all mechanic calls via callbacks — pattern from diceRoller.js and charCreate.js (D-17)"
  - "splitRoll is cosmetic display only — round total from server is authoritative for game logic"
  - "loadCombatHistory fails silently (try/catch sets innerHTML='') — history is non-critical"

patterns-established:
  - "Combat module pattern: self-contained, receives container/getState/callbacks, no app.js import"

requirements-completed:
  - BATTLE-01
  - BATTLE-02
  - BATTLE-03
  - BATTLE-04
  - BATTLE-05
  - BATTLE-06
  - BATTLE-07
  - BATTLE-08

duration: 2min
completed: 2026-03-31
---

# Phase 03 Plan 04: Battle UI Module Summary

**Self-contained battle.js with stamina bars, round cards with die faces, flee/end flow, post-battle summary, and collapsible history panel fetched from the backend**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T00:31:27Z
- **Completed:** 2026-03-31T00:33:29Z
- **Tasks:** 2 (implemented in single file pass)
- **Files modified:** 1

## Accomplishments

- `renderBattle` binds Start/Roll Round/Flee buttons to existing DOM elements via querySelector on plan 03-03 IDs
- Stamina bars update with percentage fill and aria attributes after every round; critical class applied below 25%
- Round cards display individual cosmetic die faces (split from 2d6 total), skill values, Attack Strengths, and outcome text
- Flee path calls `onFlee` callback, applies server-authoritative 2-Stamina deduction via `onStatSync`
- Post-battle summary shows outcome (Victory/Defeated/Fled), rounds count, final staminas for both sides
- `loadCombatHistory` fetches `/api/sessions/{book}/logs`, groups combat events into battles by `combat_start` markers, renders as collapsible panel newest-first

## Task Commits

1. **Task 1 + 2: Implement renderBattle and loadCombatHistory** - `6dcf960` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `js/ui/battle.js` — Full battle UI module (504 lines), replaces 7-line stub

## Decisions Made

- `splitRoll(total)`: cosmetic split using `Math.ceil(total/2)` — individual die values for display only, game correctness uses the total from the server log
- `loadCombatHistory` fails silently with empty innerHTML on error — history is non-critical feature
- New Battle button is rendered inside the summary HTML and bound at endCombatUI time; resets to setup view and re-enables buttons

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `battle.js` exports `renderBattle` and `loadCombatHistory` — ready for plan 03-05 to import and wire into `app.js`
- Plan 03-05 must remove the existing inline combat event handlers from `app.js` (start-combat, roll-round, flee-combat) and the `renderCombat()` function to avoid duplicate binding

---
*Phase: 03-battle-system*
*Completed: 2026-03-31*
