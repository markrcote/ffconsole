---
phase: 08-post-combat-flow-and-history
plan: "01"
subsystem: battle-ui
tags: [battle, modal, post-combat, css-fix]
dependency_graph:
  requires: []
  provides: [close-battle-button, correct-css-modifier, no-in-fight-history-refresh]
  affects: [js/ui/battle.js]
tech_stack:
  added: []
  patterns: [callbacks.onClose optional chaining, CSS modifier mapping via computed variable]
key_files:
  modified:
    - js/ui/battle.js
decisions:
  - Map winner 'enemy' to CSS modifier 'defeat' (not 'enemy') to match existing CSS class --defeat
  - Replace New Battle button with Return to Sheet button bound to callbacks.onClose?.()
  - Remove in-fight loadCombatHistory calls; history refresh deferred to post-modal-teardown (Plan 02)
metrics:
  duration: "~3 min"
  completed: "2026-04-03"
  tasks_completed: 2
  files_modified: 1
requirements_validated:
  - MODAL-06
  - MODAL-07
---

# Phase 08 Plan 01: Post-Combat Flow — Close Button and CSS Fix Summary

Post-combat summary in battle.js now renders with the correct CSS defeat colour class, shows a "Return to Sheet" close button as the sole interactive element, and no longer triggers premature history refresh while the modal is still open.

## What Was Built

Two targeted fixes to `js/ui/battle.js`:

1. **CSS modifier fix in renderSummaryHTML** — The existing code used `combat-summary__title--${winner}` directly, which produced `--enemy` when the enemy wins. The CSS file only defines `--defeat`. A `titleModifier` variable now maps `'enemy'` to `'defeat'` before interpolation, so defeat state renders red as intended.

2. **Close button replaces New Battle button** — The `<button id="new-battle">New Battle</button>` markup and its event binding (which called `showSetup()` to reset and reopen the setup form) are gone. In their place: `<button class="mechanic-btn mechanic-btn--primary" id="close-battle">Return to Sheet</button>` bound to `callbacks.onClose?.()`. This satisfies MODAL-07: the only dismiss path after combat is the explicit Close button.

3. **Three in-fight loadCombatHistory calls removed** — The calls after luck-adjusted end, normal round end, and flee end are deleted. The init call at the bottom of `renderBattle` (on mount) is kept. History refresh after a completed battle will be handled in Plan 02 after modal teardown.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix renderSummaryHTML CSS modifier and replace New Battle button | 5190762 | js/ui/battle.js |
| 2 | Update endCombatUI — bind Close button, remove in-fight history calls | a17f28a | js/ui/battle.js |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no stub data patterns introduced.

## Self-Check: PASSED

- js/ui/battle.js modified and committed
- Commits 5190762 and a17f28a verified
- grep confirms: close-battle (2), new-battle (0), titleModifier (1), loadCombatHistory (3 = comment + init + export)
