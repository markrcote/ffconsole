---
phase: 09-defeat-detection-and-dead-state
plan: 01
subsystem: frontend
tags: [dead-state, defeat-detection, undo, persistence, ui]
dependency_graph:
  requires: []
  provides: [dead-state-ui, stamina-0-intercept, undo-window, manual-defeat-button, dead-state-persistence]
  affects: [js/app.js, js/ui/stats.js, index.html, css/style.css]
tech_stack:
  added: []
  patterns: [undo-toast-pattern, options-disabled-pattern, dead-state-hide-siblings]
key_files:
  created: []
  modified:
    - index.html
    - js/app.js
    - js/ui/stats.js
    - css/style.css
decisions:
  - Dead flag stored in state.mechanics.dead (mechanics_json column) — no schema change needed
  - showDeadStateUI() is purely visual; enterDeadState() owns persistence
  - Undo window does NOT save to backend until the 5-second window expires or is dismissed
  - Manual defeat ("I'm Dead") has no undo window — confirmed by dialog only
  - options.disabled pattern added to renderStat() for extensibility
metrics:
  duration_minutes: 8
  completed_date: "2026-04-07"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 4
---

# Phase 09 Plan 01: Dead State Detection and UI Summary

Dead state detection with stamina-0 intercept, 5-second undo window, manual defeat button, dead state overlay with read-only final stats, persistence via mechanics_json, and reload restoration.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Dead state detection, UI, undo, persistence, reload restoration | 65a7cb7 | index.html, js/app.js, js/ui/stats.js, css/style.css |

## What Was Built

### index.html
- Added `<section id="dead-state" class="dead-state" hidden>` as first child of `<main class="adventure-sheet">`
- Dead state section contains: "YOU ARE DEAD" banner, read-only stats (Skill/Stamina/Luck with current/initial), disabled Restart and Change Book buttons (Phase 11 scope), hint text
- Added `<button class="mechanic-btn mechanic-btn--danger" id="manual-defeat-btn">I'm Dead</button>` after the test-buttons div in the Actions section

### js/app.js
- `undoTimer` module-level variable for managing the 5-second undo window
- `enterDeadState()` — sets `state.mechanics.dead = true`, saves to backend, calls `showDeadStateUI()`
- `showDeadStateUI()` — populates read-only stat values, shows dead-state section, hides all other main children
- `showUndoToast(durationMs, onUndo, onCommit)` — injects dismissible red toast after stats section; clears or fires on timer expiry
- `modifyStat()` — new `state.mechanics?.dead` guard at top blocks all changes when dead; stamina-0 intercept applies visual change, disables all stat buttons, shows undo toast; does NOT save until window expires
- `render()` — checks `state.mechanics?.dead` after rendering and calls `showDeadStateUI()` for reload restoration
- `bindEvents()` — manual defeat button handler: guards against already-dead and no-book, shows confirmation dialog, calls `enterDeadState()` directly (no undo window)

### js/ui/stats.js
- `renderStat(name, state, options = {})` — added `options` third argument (backward compatible)
- `if (options.disabled)` block force-disables both decrease and increase buttons regardless of normal logic
- Hold timer callback in `startHold()` now checks `btn.disabled` before firing `onModify` — prevents hold timer firing during the undo window (Pitfall 2)

### css/style.css
- `.dead-state` — centered layout, 2rem padding
- `.dead-state__banner` — large red uppercase heading with border and subtle background tint
- `.dead-state__stats` — column flex layout, max-width 280px, centered
- `.dead-state__stat` — flex row with paper-dark background
- `.dead-state__stat-label` / `.dead-state__stat-value` — typography using existing vars
- `.dead-state__actions` — column flex, max-width 200px, centered
- `.dead-state__hint` — small italic text
- `.mechanic-btn--danger` — danger variant: paper-dark background, accent-red text and border
- `.undo-toast` — red background, paper-bg text, flex row
- `.undo-toast__text` / `.undo-toast__btn` — toast content styles

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Dead flag in mechanics_json (not new DB column) | No schema migration; mechanics_json already handles arbitrary fields |
| Undo window does not save until expiry | Prevents false-dead saves from misclicks (Pitfall 1 from RESEARCH.md) |
| Manual defeat has no undo window | Intentional action; dialog confirmation is sufficient protection |
| Restart/Change Book buttons disabled in dead state | Phase 11 scope; placeholder present so UI is complete, not empty |
| showDeadStateUI() separated from enterDeadState() | Reload restoration only needs visual update, not re-save |

## Deviations from Plan

None — plan executed exactly as written.

## Auto-approved Checkpoint

**Task 2 (checkpoint:human-verify)** — Auto-approved per `workflow.auto_advance: true` config.
What was built: sheet defeat detection with undo window, dead state overlay, manual defeat button, persistence across reload.

## Known Stubs

- `id="dead-restart"` and `id="dead-change-book"` buttons are present but `disabled`. These are Phase 11 scope (Restart/Change Book recovery flows). The hint text "Recovery actions coming soon" informs the player. These stubs do NOT prevent the plan's goal (dead state detection and persistence) from being achieved.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. Dead flag is set via existing PUT upsert path (mechanics_json). Threat model T-09-01 accepted as documented in plan.

## Self-Check: PASSED

- [x] index.html contains `id="dead-state"`: FOUND
- [x] js/app.js contains `enterDeadState`: FOUND (3 occurrences)
- [x] js/app.js contains `mechanics?.dead`: FOUND (3 occurrences)
- [x] js/ui/stats.js contains `options.disabled`: FOUND
- [x] css/style.css contains `.dead-state`: FOUND
- [x] css/style.css contains `.undo-toast`: FOUND
- [x] Commit 65a7cb7: FOUND
