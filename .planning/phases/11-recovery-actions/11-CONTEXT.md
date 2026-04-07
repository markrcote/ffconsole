# Phase 11: Recovery Actions — Context

**Phase:** 11 — Recovery Actions
**Milestone:** v1.2 Defeat State
**Created:** 2026-04-07
**Requirements:** DEFEAT-08, DEFEAT-09

---

## Domain Boundary

From the dead state, the player has two clear forward paths:

1. **Restart** — open the full charCreate flow (book picker, same book pre-selected), create a fresh character. The dead session is NOT deleted first; `_applyNewCharacter` overwrites it.
2. **Change Book** — confirm dialog → DELETE current session → open fresh book picker (no pre-selection).

This phase wires the two `disabled` buttons already in `index.html` (`#dead-restart`, `#dead-change-book`) and adds a `deleteSession()` function to `storage.js`.

---

## Decisions

### D-01: Restart — full charCreate flow, same book pre-selected

Tapping "Restart" calls `showCharCreate()` exactly as the "New Adventure" button does, with the current book number passed as `currentBook` so it renders pre-selected in the book list.

- Player can change to a different book if they want — that is acceptable behavior
- `_applyNewCharacter()` creates fresh state (no `dead` flag) regardless of which book is chosen
- Dead session in the DB is overwritten by the PUT in `_applyNewCharacter`
- No changes needed to `charCreate.js` — existing API is sufficient

### D-02: Change Book — confirm dialog then DELETE, then fresh book picker

Tapping "Change Book":
1. `window.confirm('Delete this session? This cannot be undone.')` — if cancelled, no-op
2. DELETE `/api/sessions/{currentBook}` on the backend
3. Remove `currentBook` key from `games` object + remove from localStorage
4. Call `showCharCreate()` with `currentBook = null` (no pre-selection, backdrop not dismissible)

When `currentBook` is `null`, the charCreate overlay cannot be dismissed (no backdrop click, no Escape) — player must pick a book. This matches the existing first-launch behavior.

### D-03: deleteSession() added to storage.js

New export in `storage.js`:

```js
async function deleteSession(bookNumber) {
    // Remove from localStorage
    // DELETE /api/sessions/{bookNumber}
}
```

Cleans both localStorage and backend. Returns nothing (caller handles UI).

### D-04: Buttons enabled at bind time, not conditionally

The `disabled` attribute is removed when the event listeners are bound (in `bindEvents()`). The dead-state section is only visible when dead — no additional guard needed on the buttons themselves.

### D-05: Hint text removed

`<p class="dead-state__hint">Recovery actions coming soon</p>` is removed from `index.html` once buttons are wired.

### Claude's Discretion

- Exact wording of the confirm dialog for Change Book
- Whether to add a brief `console.error` guard around the DELETE fetch failure (fail silently vs log)

---

## Canonical Refs

- `index.html:11-31` — `#dead-state` section; `#dead-restart` and `#dead-change-book` buttons (currently `disabled`)
- `js/app.js:524` — `bindEvents()` — where button listeners are added
- `js/app.js:530-540` — "New Adventure" button → `showCharCreate()` call — template for Restart wiring
- `js/app.js:492-519` — `_applyNewCharacter()` — creates fresh state, saves, renders
- `js/ui/charCreate.js:99` — `showCharCreate({ games, currentBook, save, onComplete })` — existing API, no changes needed
- `js/storage.js` — `save`, `load`, `clear` exports — `deleteSession()` goes here
- `backend/routers/sessions.py` — DELETE `/api/sessions/{book_number}` endpoint (verify it exists)
- `.planning/REQUIREMENTS.md` — DEFEAT-08, DEFEAT-09

---

## Deferred Ideas

- None — discussion stayed within phase scope.

---

*Phase: 11-recovery-actions*
*Context gathered: 2026-04-07*
