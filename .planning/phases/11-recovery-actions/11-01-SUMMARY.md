---
plan: 11-01
phase: 11-recovery-actions
status: completed
---

# Summary: Recovery Action Buttons

## What was built

Wired the Restart and Change Book buttons on the dead state screen, completing the v1.2 Defeat State milestone.

## Key files changed

- `js/storage.js` — Added `deleteSession(bookNumber)`: removes from localStorage and sends DELETE to `/api/sessions/{book}`
- `js/app.js` — Added event listeners for `#dead-restart` and `#dead-change-book` in `bindEvents()`; fixed `render()` to restore normal sheet UI when not dead
- `js/ui/charCreate.js` — Fixed `selectedBook` initialization to use `currentBook` for pre-selection; added scroll-into-view for pre-selected book
- `index.html` — Added `mechanic-btn--primary`/`mechanic-btn--danger` class modifiers; removed hint text
- `css/style.css` — Added `.mechanic-btn--danger:hover` rule

## Deviations

Two bugs in pre-existing code were found and fixed during verification:
1. `charCreate.js` never initialized `selectedBook` from `currentBook` — Restart appeared to pre-select a book visually but `selectedBook` was null, causing "choose a book to continue" error
2. `render()` in `app.js` only showed dead UI when dead but never restored normal sheet children — after Restart, the dead state DOM persisted until page refresh

## Self-Check: PASSED
