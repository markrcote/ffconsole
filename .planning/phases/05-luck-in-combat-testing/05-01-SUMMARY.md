---
phase: 05-luck-in-combat-testing
plan: "01"
subsystem: mechanics
tags: [combat, luck, mechanics, backend]
dependency_graph:
  requires: []
  provides: [testCombatLuck-export, combat_luck_test-backend-handler]
  affects: [js/mechanics.js, backend/routers/actions.py]
tech_stack:
  added: []
  patterns: [testLuck-pattern, elif-chain-pattern]
key_files:
  created: []
  modified:
    - js/mechanics.js
    - backend/routers/actions.py
decisions:
  - "combat_luck_test is a distinct action type (not reusing luck_test) per D-08 — enables separate filtering/display in future"
  - "Stamina adjustment uses delta formula (damage_before - damage_after) rather than replacement — preserves server as source of truth for stamina"
  - "Wounding context (player hit enemy) sends no server stamina change — enemy stamina tracked client-side in battle.js"
metrics:
  duration: 2min
  completed: "2026-04-02"
  tasks: 2
  files: 2
---

# Phase 5 Plan 1: Combat Luck Test — Data Layer Summary

Combat luck test mechanic function and backend handler: `testCombatLuck()` in mechanics.js posting `combat_luck_test` action; backend atomically decrements luck and applies stamina delta for wounded context.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add testCombatLuck() to mechanics.js | a9689b8 | js/mechanics.js |
| 2 | Add combat_luck_test handler to backend actions.py | 6b9d372 | backend/routers/actions.py |

## What Was Built

### testCombatLuck() — js/mechanics.js

New exported async function immediately after `testLuck()`, following the same pattern:

- Accepts: `bookNumber, luckCurrent, round, context, damageBefore`
- Rolls 2d6, checks `roll <= luckCurrent` for success
- Computes `luckAfter = Math.max(0, luckCurrent - 1)`
- Computes `damageAfter`:
  - `wounding` context (player hit enemy): lucky=4, unlucky=1
  - `wounded` context (enemy hit player): lucky=1, unlucky=3
- Posts `combat_luck_test` action with all details
- Returns `{ roll, success, luckAfter, damageAfter, session }`

### combat_luck_test handler — backend/routers/actions.py

New `elif` branch in the `post_action` function's if/elif chain:

- Always decrements `luck_current` by 1 (both contexts)
- Wounded context only: applies stamina delta = `damage_before - damage_after`
  - Lucky wounded: delta=+1 (restores 1 stamina — took 1 instead of 2)
  - Unlucky wounded: delta=-1 (deducts 1 more — took 3 instead of 2)
- Wounding context: no server stamina change (enemy stamina is client-side)
- Sets `updated_at` timestamp

## Decisions Made

- `combat_luck_test` is a distinct action type (not reusing `luck_test`) per D-08 — enables separate filtering/display in future UI work
- Stamina delta formula (`damage_before - damage_after`) rather than replacement value — server remains source of truth for player stamina
- Enemy stamina in `wounding` context intentionally not touched server-side — battle.js owns enemy stamina client-side

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- js/mechanics.js: `export async function testCombatLuck` — FOUND (line 51)
- backend/routers/actions.py: `elif body.action_type == "combat_luck_test"` — FOUND (line 59)
- Commit a9689b8 — FOUND
- Commit 6b9d372 — FOUND
- Backend imports OK: `python3 -c "from backend.main import app; print('OK')"` → OK
