---
phase: 08-post-combat-flow-and-history
plan: "02"
subsystem: battle-ui
tags: [battle, modal, post-combat, dismiss-guard, history-refresh]
dependency_graph:
  requires:
    - phase: 08-01
      provides: close-battle-button, correct-css-modifier, no-in-fight-history-refresh
  provides:
    - postCombatPending dismiss guard blocks backdrop/Escape after combat ends
    - onClose callback wired in wrappedCallbacks to clear flag and close modal
    - onModalClose teardown hook fires after DOM removal for post-close side effects
    - history refresh triggered from app.js after modal teardown via onModalClose
  affects: [js/ui/battleModal.js, js/app.js]
tech_stack:
  added: []
  patterns:
    - postCombatPending flag pattern for state-dependent modal dismiss guard
    - onModalCloseCallback teardown hook for post-close side effects without circular imports
key_files:
  modified:
    - js/ui/battleModal.js
    - js/app.js
key-decisions:
  - "postCombatPending set on combatActive→false transition in onCombatStateChange interceptor"
  - "onModalCloseCallback fires after focus restore in teardown — history refresh sees complete DOM state"
  - "onClose added to wrappedCallbacks so battle.js Close button can dismiss without importing battleModal.js (D-17)"
requirements-completed:
  - MODAL-07
  - MODAL-08
  - MODAL-09
duration: ~5min
completed: "2026-04-03"
tasks_completed: 2
files_modified: 2
---

# Phase 08 Plan 02: Post-Combat Dismiss Guard and History Refresh Summary

**postCombatPending flag blocks modal dismiss after combat ends; onModalClose teardown hook triggers automatic history refresh in app.js after modal DOM removal**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-04-03
- **Tasks:** 2 of 2 (checkpoint:human-verify pending)
- **Files modified:** 2

## Accomplishments

- Added `postCombatPending` module-level flag in battleModal.js: set when `combatActive` transitions from true to false (combat ends), cleared in teardown after DOM removal
- Updated both dismiss guards (Escape and backdrop click) to check `combatActive || postCombatPending` — modal shakes post-combat until explicitly closed via "Return to Sheet"
- Added `onClose` to `wrappedCallbacks` so battle.js Close button can call `closeBattleModal()` without importing battleModal.js (D-17 pattern maintained)
- Added `onModalCloseCallback` teardown hook: set from `callbacks.onModalClose` at open time, fired after `focus()` restore in teardown, then nulled
- Added `onModalClose` callback in app.js openBattleModal call: fetches `#combat-history` container fresh at call time and calls `loadCombatHistory` — history refreshes after modal is fully gone

## Task Commits

1. **Task 1: battleModal.js — postCombatPending, onClose, updated guards, onModalClose teardown** - `d7bdc29` (feat)
2. **Task 2: app.js — pass onModalClose callback to openBattleModal** - `934ea4c` (feat)

## Files Created/Modified

- `js/ui/battleModal.js` — Added postCombatPending flag, onModalCloseCallback, updated wrappedCallbacks and both dismiss guards, teardown fires callback
- `js/app.js` — Added onModalClose callback to openBattleModal call that triggers loadCombatHistory

## Decisions Made

- `onClose` added to wrappedCallbacks (not exported from battleModal.js) to maintain D-17: battle.js never imports battleModal.js; the close function is injected as a callback
- `onModalCloseCallback` fired after `focus()` in teardown rather than before, so the Start Battle button receives focus first, then history refreshes — avoids focus jumping during render
- historyContainer fetched via `getElementById` at callback call time (not captured at open time) — avoids stale reference if DOM changes between modal open and close

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no stub data patterns introduced.

## Checkpoint Status

Task 3 is `checkpoint:human-verify` — awaiting user verification of end-to-end post-combat flow.

## Self-Check: PASSED

- js/ui/battleModal.js: postCombatPending (10 occurrences), both dismiss guards updated, onClose in wrappedCallbacks, onModalCloseCallback fires in teardown
- js/app.js: onModalClose callback present, loadCombatHistory called inside callback
- Commits d7bdc29 and 934ea4c verified in git log
</content>
</invoke>