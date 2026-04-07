---
phase: 09-defeat-detection-and-dead-state
plan: 02
subsystem: frontend
tags: [defeat-detection, combat, callbacks, battle-system]
dependency_graph:
  requires: [09-01]
  provides: [onPlayerDefeated-callback]
  affects: [js/ui/battle.js, js/ui/battleModal.js, js/app.js]
tech_stack:
  added: []
  patterns: [optional-chaining-callback, wrappedCallbacks-passthrough]
key_files:
  created: []
  modified:
    - js/ui/battle.js
    - js/ui/battleModal.js
    - js/app.js
decisions:
  - onPlayerDefeated placed at END of endCombatUI (after summary rendered and close button wired) so Phase 10 receives the signal after UI is stable
  - Optional chaining (?.) used for backward compatibility with callers that omit the callback
  - battleModal.js intercepts the callback (explicit passthrough) matching the existing wrappedCallbacks pattern for future Phase 10 override point
  - app.js wires a no-op stub with explicit comment preventing enterDeadState() call (Research Pitfall 5)
metrics:
  duration_minutes: 3
  completed_date: "2026-04-07"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 3
---

# Phase 09 Plan 02: Combat Defeat Signal Summary

onPlayerDefeated callback wired through battle.js → battleModal.js → app.js; fires when player stamina reaches 0 in combat; no-op stub in Phase 9, ready for Phase 10 modal defeat screen.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add onPlayerDefeated callback to battle.js, battleModal.js, and app.js | 06799ea | js/ui/battle.js, js/ui/battleModal.js, js/app.js |

## What Was Built

### js/ui/battle.js
- Updated `renderBattle` JSDoc `@param callbacks` to document `onPlayerDefeated`
- Added `if (winner === 'enemy') { callbacks.onPlayerDefeated?.(); }` at the end of `endCombatUI()` body — after summary is rendered and close button is wired
- Covers both defeat paths: roll-round handler and luck-prompt handler (both call `endCombatUI`)

### js/ui/battleModal.js
- Added `onPlayerDefeated` key to `wrappedCallbacks` object inside `openBattleModal`
- Follows existing pattern: battleModal.js intercepts (for future Phase 10 use) and propagates to app-level callback via `callbacks.onPlayerDefeated?.()`

### js/app.js
- Added `onPlayerDefeated: () => { /* Phase 9 no-op stub */ }` callback in the `openBattleModal` call inside `init()`
- Placed after `onCombatStateChange` and before `onModalClose`
- Explicit comment forbids calling `enterDeadState()` — sheet dead state is Phase 10's responsibility

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Signal fires after summary rendered, before function returns | Phase 10 needs stable UI before overlaying defeat screen |
| Optional chaining on all call sites | Backward compatibility; callers omitting callback don't break |
| Explicit intercept in battleModal.js wrappedCallbacks | Gives Phase 10 a clean override point in battleModal.js without touching battle.js again |
| No-op stub with comment in app.js | Research Pitfall 5: combat defeat must NOT trigger sheet dead state — that's Phase 10 after modal closes |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `onPlayerDefeated` in app.js is intentionally a no-op. Phase 10 will replace it with a call that triggers the modal defeat screen. This stub is the plan's stated deliverable, not a gap.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. The callback is client-side only with no security implications. Threat model T-09-04 accepted as documented in plan.

## Self-Check: PASSED

- [x] js/ui/battle.js contains `onPlayerDefeated`: FOUND (lines 164, 313)
- [x] js/ui/battleModal.js contains `onPlayerDefeated`: FOUND (lines 145, 147)
- [x] js/app.js contains `onPlayerDefeated`: FOUND (line 91)
- [x] battle.js endCombatUI has `if (winner === 'enemy')` block with `callbacks.onPlayerDefeated?.()`: FOUND
- [x] battleModal.js wrappedCallbacks has `onPlayerDefeated` key: FOUND
- [x] app.js onPlayerDefeated does NOT call enterDeadState: CONFIRMED
- [x] Commit 06799ea: FOUND
