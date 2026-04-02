---
phase: 05-luck-in-combat-testing
plan: "02"
subsystem: battle-ui
tags: [combat, luck, battle-ui, css]
dependency_graph:
  requires: [05-01]
  provides: [luck-prompt-ui, round-card-luck-row, history-luck-rendering, onTestLuck-callback]
  affects: [js/ui/battle.js, js/app.js, css/style.css]
tech_stack:
  added: []
  patterns: [luck-prompt-lifecycle, D-17-callback-pattern, BEM-luck-css]
key_files:
  created: []
  modified:
    - js/ui/battle.js
    - js/app.js
    - css/style.css
decisions:
  - "dismissLuckPrompt() as first line in rollRoundBtn handler — implements D-03 (next roll silently dismisses) and D-05 (ephemeral window) in one line"
  - "showLuckPrompt() scoped inside renderBattle() closure — accesses enemy, roundResultEl, historyEl, getState, callbacks without parameters"
  - "luckByRound keyed by d.round (from details) — matches combat_luck_test detail shape from Plan 01 backend handler"
metrics:
  duration: 2min
  completed: "2026-04-02"
  tasks: 2
  files: 3
---

# Phase 5 Plan 2: Luck-in-Combat UI — Battle Panel, Round Card, History

Luck prompt button, round card luck result row, combat history luck suffix, and app.js callback wiring: complete user-facing luck-in-combat feature with `.mechanic-btn` prompt, re-rendered round card, and per-round luck display in Past Battles.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add luck prompt, round card luck row, and history rendering to battle.js | 1c91c83 | js/ui/battle.js |
| 2 | Wire onTestLuck callback in app.js and add CSS | 15e4280 | js/app.js, css/style.css |

## What Was Built

### Luck Prompt Lifecycle — js/ui/battle.js

Two helpers added inside `renderBattle()` closure:

- `dismissLuckPrompt()` — removes the `#luck-prompt-btn` DOM node if present; called at start of roll-round handler (D-03/D-05) and in `endCombatUI()` (Risk 4 guard)
- `showLuckPrompt(context, currentRound, roundResult)` — creates `.mechanic-btn` button appended to `roundResultEl`; on click, calls `callbacks.onTestLuck()`, adjusts enemy stamina locally for wounding context, syncs player stats via `onStatSync`, re-renders round card with `luckResult` param

Roll-round handler changes:
- `dismissLuckPrompt()` as first line (dismisses pending prompt before new round)
- After round card render: `if (r.result !== 'tie') showLuckPrompt(context, round, r)` — per D-02 (no prompt on ties)

`endCombatUI()`: `dismissLuckPrompt()` as first line — prevents prompt lingering after combat ends (Risk 4)

### Round Card Luck Row — js/ui/battle.js

`renderRoundCard()` extended with `luckResult = null` parameter. When non-null, appends:
```html
<div class="combat-round-card__luck combat-round-card__luck--{lucky|unlucky}">
    Lucky! / Unlucky! {enemy} takes N damage / You take N Stamina damage
</div>
```
Inside the `.combat-round-card` div after the outcome row (per D-06).

### History Luck Rendering — js/ui/battle.js

- `loadCombatHistory` filter: added `combat_luck_test` to allow luck action logs through
- Grouping loop: new `luckTests: []` on battle object; `combat_luck_test` entries pushed to `current.luckTests`
- `renderBattleEntry()`: builds `luckByRound` map keyed by `d.round`; passes matched luck log to `renderRoundEntry()`
- `renderRoundEntry()` extended with `luckLog = null`: appends `— Lucky (N dmg)` or `— Unlucky (N dmg)` suffix (per D-09)

### onTestLuck Callback — js/app.js

- Import updated: `testCombatLuck` added to mechanics.js import line
- `renderBattle()` callbacks extended with `onTestLuck` arrow function wrapping `testCombatLuck()` (D-17 pattern: battle.js never imports mechanics.js directly)

### CSS — css/style.css

New rules appended (Phase 5 section):
- `.combat-round-card__luck` — Caveat font, dashed top border using `--parchment-stain`
- `.combat-round-card__luck--lucky` — `color: var(--accent-green)`
- `.combat-round-card__luck--unlucky` — `color: var(--accent-red)`
- `.luck-prompt` — flex centering container (reserved for future use; prompt button uses `.mechanic-btn` directly)

## Decisions Made

- `dismissLuckPrompt()` as first line in roll handler — simplest way to implement D-03 and D-05 simultaneously
- `showLuckPrompt()` scoped inside `renderBattle()` closure — accesses `enemy`, `roundResultEl`, `historyEl`, `getState`, `callbacks` without extra parameters, consistent with existing helper pattern
- `luckByRound` keyed by `d.round` from details object — matches `combat_luck_test` detail shape from Plan 01

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- js/ui/battle.js: `function dismissLuckPrompt()` — FOUND (line 194)
- js/ui/battle.js: `function showLuckPrompt(` — FOUND (line 199)
- js/ui/battle.js: `callbacks.onTestLuck(` — FOUND (line 211)
- js/ui/battle.js: `luck-prompt-btn` — FOUND (lines 195, 203)
- js/ui/battle.js: `combat-round-card__luck` — FOUND (line 88)
- js/ui/battle.js: `luckResult = null` in renderRoundCard — FOUND (line 74)
- js/ui/battle.js: `r.result !== 'tie'` — FOUND (line 406)
- js/ui/battle.js: `luckTests: []` — FOUND (line 573)
- js/ui/battle.js: `luckByRound` — FOUND (lines 521, 524, 526)
- js/ui/battle.js: `dismissLuckPrompt` calls — FOUND (lines 194, 200, 290, 357) — 4 occurrences (definition + 3 calls, plan required at least 3)
- js/app.js: `testCombatLuck` import — FOUND (line 8)
- js/app.js: `onTestLuck:` in callbacks — FOUND (line 80)
- css/style.css: `.combat-round-card__luck {` — FOUND (line 1042)
- css/style.css: `.combat-round-card__luck--lucky {` with accent-green — FOUND (line 1050)
- css/style.css: `.combat-round-card__luck--unlucky {` with accent-red — FOUND (line 1054)
- css/style.css: `.luck-prompt {` — FOUND (line 1058)
- Commit 1c91c83 — FOUND
- Commit 15e4280 — FOUND
