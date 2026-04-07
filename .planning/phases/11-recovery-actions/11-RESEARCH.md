# Phase 11: Recovery Actions - Research

**Researched:** 2026-04-07
**Domain:** Vanilla JS frontend wiring — event binding, storage layer, flow control
**Confidence:** HIGH

## Summary

Phase 11 is a focused wiring task: two `disabled` buttons already rendered in `index.html` need event listeners added in `bindEvents()`, a `deleteSession()` function added to `storage.js`, and one HTML element removed. All decisions are locked in CONTEXT.md and UI-SPEC. No new UI surfaces, no new CSS classes, no new modules.

The DELETE `/api/sessions/{book_number}` endpoint is confirmed present in `backend/routers/sessions.py` (returns 204 No Content). The `showCharCreate()` API in `charCreate.js` already accepts `currentBook` to pre-select a book; passing `null` produces the first-launch (non-dismissible) behavior. The `_applyNewCharacter()` function already overwrites any existing session on PUT — dead session cleanup is automatic.

**Primary recommendation:** Wire `#dead-restart` and `#dead-change-book` in `bindEvents()`, add `deleteSession()` to `storage.js`, remove the hint `<p>` from `index.html`, and add `mechanic-btn--primary` / `mechanic-btn--danger` classes to the two buttons. Four files touched, no new modules needed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Restart — full charCreate flow, same book pre-selected**
Tapping "Restart" calls `showCharCreate()` exactly as the "New Adventure" button does, with the current book number passed as `currentBook` so it renders pre-selected in the book list. Player can change to a different book — acceptable. `_applyNewCharacter()` creates fresh state (no `dead` flag). Dead session in the DB is overwritten by the PUT in `_applyNewCharacter`. No changes needed to `charCreate.js`.

**D-02: Change Book — confirm dialog then DELETE, then fresh book picker**
Tapping "Change Book":
1. `window.confirm('Delete this session? This cannot be undone.')` — if cancelled, no-op
2. DELETE `/api/sessions/{currentBook}` on the backend
3. Remove `currentBook` key from `games` object + remove from localStorage
4. Call `showCharCreate()` with `currentBook = null` (no pre-selection, backdrop not dismissible)

**D-03: deleteSession() added to storage.js**
New export in `storage.js` that cleans both localStorage and backend. Returns nothing; caller handles UI.

**D-04: Buttons enabled at bind time, not conditionally**
The `disabled` attribute is removed when the event listeners are bound (in `bindEvents()`). No additional guard needed on the buttons.

**D-05: Hint text removed**
`<p class="dead-state__hint">Recovery actions coming soon</p>` is removed from `index.html` once buttons are wired.

### Claude's Discretion

- Exact wording of the confirm dialog for Change Book
- Whether to add a brief `console.error` guard around the DELETE fetch failure (fail silently vs log)

Both resolved in UI-SPEC:
- Confirm text: `'Delete this session? This cannot be undone.'`
- DELETE failure: `console.error('deleteSession failed:', err)` then continue — flow proceeds regardless.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEFEAT-08 | From dead state, player can "Restart" to re-roll a new character for the same book | `showCharCreate()` already accepts `currentBook` for pre-selection; `_applyNewCharacter()` overwrites dead session via PUT |
| DEFEAT-09 | From dead state, player can "Change Book" to delete current session and return to book picker | DELETE endpoint confirmed in `sessions.py:110-116`; `showCharCreate(null)` produces non-dismissible picker |
</phase_requirements>

---

## Standard Stack

This phase uses only the existing project stack — no new dependencies.

| Component | Location | Purpose |
|-----------|----------|---------|
| `js/app.js` | `bindEvents()` | Add event listeners to `#dead-restart` and `#dead-change-book` |
| `js/storage.js` | New export `deleteSession()` | DELETE backend + clear localStorage entry |
| `index.html` | lines 28-31 | Remove `disabled`, add CSS classes, remove hint `<p>` |
| `css/style.css` | Possibly add `:hover` for `--danger` | Optional hover state if missing |

**Installation:** None required.

---

## Architecture Patterns

### Existing Pattern: bindEvents() listener registration

`bindEvents()` in `app.js` (line 524) follows a consistent pattern: get element by ID, guard with `if (el)`, add `addEventListener`. The two dead-state buttons follow this exact pattern.

```js
// Source: js/app.js:529-541 — "New Adventure" button (template for Restart wiring)
const newGameBtn = document.getElementById('new-game');
if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
        showCharCreate({
            games,
            currentBook,
            save,
            onComplete: async (bookNumber, stats, name, superpower) => {
                await _applyNewCharacter(bookNumber, stats, name, superpower);
            },
        });
    });
}
```

Restart wires identically with `document.getElementById('dead-restart')`.

### Existing Pattern: showCharCreate() API

`showCharCreate({ games, currentBook, save, onComplete })` in `charCreate.js:99`:
- `currentBook` non-null → pre-selects that book in the list [VERIFIED: charCreate.js:101, renderModalBookList line 63 checks `isSelected === book.number`]
- `currentBook` null → no pre-selection; overlay is non-dismissible (matches first-launch behavior in `app.js:60-69`)
- `onComplete` receives `(bookNumber, stats, name, superpower)` → caller passes to `_applyNewCharacter()`

### Existing Pattern: confirm() before destructive action

`app.js:550` uses the same `window.confirm()` pattern for manual defeat. The UI-SPEC resolves the exact text as `'Delete this session? This cannot be undone.'` [VERIFIED: UI-SPEC line 143-145, matching existing pattern at app.js:550].

### New Pattern: deleteSession() in storage.js

The existing `storage.js` exports `{ save, load, clear }`. `deleteSession(bookNumber)` is a new named export following the same async function style:

```js
// Pattern derived from existing save() — verified against storage.js
async function deleteSession(bookNumber) {
    // 1. Remove from localStorage (full state blob)
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.games) {
                delete parsed.games[bookNumber];
                parsed.currentBook = null;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            }
        }
    } catch (e) {
        console.error('deleteSession localStorage cleanup failed:', e);
    }

    // 2. DELETE from backend
    try {
        const response = await fetch(`/api/sessions/${bookNumber}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (e) {
        console.error('deleteSession failed:', e);
        // Continue — flow proceeds regardless (best-effort cleanup)
    }
}
```

[VERIFIED: sessions.py:110-116 — DELETE endpoint returns 204 No Content; 404 if not found, which is non-fatal for our purpose]

### Change Book flow in app.js caller

After `deleteSession()` completes (or fails), the caller must also clear the in-memory `games` and `currentBook` module variables before calling `showCharCreate()`:

```js
// In bindEvents() — Change Book handler
const changeBookBtn = document.getElementById('dead-change-book');
if (changeBookBtn) {
    changeBookBtn.removeAttribute('disabled');
    changeBookBtn.addEventListener('click', async () => {
        const confirmed = window.confirm('Delete this session? This cannot be undone.');
        if (!confirmed) return;
        const bookToDelete = currentBook;
        await deleteSession(bookToDelete);
        delete games[bookToDelete];
        currentBook = null;
        showCharCreate({
            games,
            currentBook,   // null
            save,
            onComplete: async (bookNumber, stats, name, superpower) => {
                await _applyNewCharacter(bookNumber, stats, name, superpower);
            },
        });
    });
}
```

### Anti-Patterns to Avoid

- **Calling `save()` after `deleteSession()`:** Don't re-save state to localStorage after deletion — this would re-create the deleted entry.
- **Guarding buttons conditionally:** D-04 says remove `disabled` at bind time, not based on dead state check. The `#dead-state` section is only visible when dead; no further guard needed.
- **Modifying charCreate.js:** D-01 explicitly locks "no changes needed to `charCreate.js`."

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Book pre-selection in charCreate | Custom book picker | Pass `currentBook` to existing `showCharCreate()` | Already implemented in charCreate.js renderModalBookList |
| Confirm dialog | Custom modal | `window.confirm()` | Matches established codebase pattern; natively accessible |
| Backend DELETE | Custom fetch util | Inline `fetch('/api/sessions/{n}', { method: 'DELETE' })` | Simple one-off; existing save() shows the pattern |

---

## File Change Map

| File | Change | Lines affected |
|------|--------|----------------|
| `index.html` | Remove `disabled` from `#dead-restart`, `#dead-change-book`; add CSS modifier classes; remove `<p class="dead-state__hint">` | 28-31 |
| `js/app.js` | Add two event listeners in `bindEvents()`; import `deleteSession` from storage.js | ~524 area |
| `js/storage.js` | Add `deleteSession(bookNumber)` export | New function + export line |
| `css/style.css` | Add `.mechanic-btn--danger:hover` if missing | Adjacent to line 1411 |

---

## Verified State: Backend DELETE Endpoint

[VERIFIED: backend/routers/sessions.py:110-116]

```python
@router.delete("/sessions/{book_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(book_number: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.book_number == book_number).first()
    if not session:
        raise HTTPException(status_code=404, detail=...)
    db.delete(session)
    db.commit()
```

Returns 204 on success, 404 if not found. A 404 on delete (session already gone) is non-fatal — `deleteSession()` in storage.js should `console.error` and continue. [VERIFIED: UI-SPEC line 159 — "allow the flow to continue"]

---

## Verified State: CSS Classes

[VERIFIED: css/style.css]

| Class | Exists | Lines |
|-------|--------|-------|
| `.mechanic-btn` | Yes | 484 |
| `.mechanic-btn--primary` | Yes | 507 |
| `.mechanic-btn--danger` | Yes | 1403 |
| `.mechanic-btn--danger:hover` | **No** | — |
| `.dead-state__hint` | Yes | 1396 (to be removed if unused after HTML change) |

`.mechanic-btn--danger:hover` is absent — only `:active` is defined at line 1411. Per UI-SPEC line 216-222, add `:hover` adjacent to `:active`:

```css
.mechanic-btn--danger:hover {
    background: rgba(139, 37, 0, 0.12);
}
```

---

## Verified State: charCreate.js pre-selection behavior

[VERIFIED: charCreate.js:57-71]

`renderModalBookList()` marks a `<li>` with `class="book-item selected"` when `selectedBook === book.number`. The `selectedBook` variable in `showCharCreate` is initialized from `currentBook` parameter. Passing `currentBook` (book number) pre-selects that book immediately when the modal renders.

---

## Verified State: index.html buttons

[VERIFIED: index.html:28-31]

```html
<button class="mechanic-btn" id="dead-restart" disabled>Restart</button>
<button class="mechanic-btn" id="dead-change-book" disabled>Change Book</button>
```

Both buttons have `mechanic-btn` base class only — `mechanic-btn--primary` and `mechanic-btn--danger` modifiers are absent and must be added.

---

## Common Pitfalls

### Pitfall 1: Dead `games` and `currentBook` in-memory state after Change Book
**What goes wrong:** `deleteSession()` cleans localStorage and backend, but if `games[bookNumber]` and `currentBook` module vars in `app.js` are not cleared, subsequent operations (e.g., if the overlay is dismissed) may attempt to save the deleted session.
**Why it happens:** `deleteSession()` is in `storage.js` and cannot reach `app.js` module state.
**How to avoid:** Caller in `bindEvents()` must explicitly `delete games[bookToDelete]; currentBook = null;` after `await deleteSession()` and before calling `showCharCreate()`.
**Warning signs:** Session re-appearing in backend after Change Book.

### Pitfall 2: import not updated in app.js
**What goes wrong:** `deleteSession` added to `storage.js` but not imported in `app.js`.
**Why it happens:** `app.js` currently imports `{ save, load }` from `./storage.js` — `clear` is not even imported.
**How to avoid:** Update the import line at `app.js:6` to add `deleteSession`.

### Pitfall 3: Button classes not added to index.html
**What goes wrong:** Buttons work functionally but visual styling is wrong — both appear as plain `mechanic-btn` (parchment background) rather than primary (ink fill) and danger (red border).
**How to avoid:** Add `mechanic-btn--primary` to `#dead-restart` and `mechanic-btn--danger` to `#dead-change-book` in `index.html`.

### Pitfall 4: `disabled` attribute removed in HTML vs JS
**What goes wrong:** If `disabled` is removed from `index.html` (HTML-side), buttons are clickable before `bindEvents()` runs (during async `init()` load). If removed only in JS at bind time, buttons are correctly inert during load.
**How to avoid:** Per D-04 — remove `disabled` in `bindEvents()` via `el.removeAttribute('disabled')`, NOT by editing `index.html` to remove the attribute. The `index.html` buttons should keep `disabled` in markup.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely frontend JS/HTML/CSS changes. External dependencies are limited to the existing FastAPI backend (already running for development); the DELETE endpoint is confirmed present.

---

## Validation Architecture

No test framework is configured in this project (vanilla JS, no Jest/Vitest config detected). Validation is manual.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification |
|--------|----------|-----------|-------------|
| DEFEAT-08 | Restart opens charCreate with same book pre-selected; new character clears dead flag | Manual smoke | Load dead state → tap Restart → verify overlay opens with book pre-selected → confirm → verify sheet shows fresh stats, no dead state |
| DEFEAT-09 | Change Book shows confirm → DELETEs session → opens fresh book picker (non-dismissible) | Manual smoke | Load dead state → tap Change Book → verify confirm dialog → confirm → verify backend has no session for old book → verify charCreate opens with no pre-selection |

### Wave 0 Gaps

None — no test infrastructure needed for this phase.

---

## Security Domain

This phase has no authentication, no user input beyond button clicks and `window.confirm()`, and no sensitive data handling. The DELETE endpoint is unprotected by design (single-player, server-backed, no multi-user auth in scope). No ASVS categories apply to this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `showCharCreate()` with non-null `currentBook` pre-selects that book in the rendered list | Architecture Patterns | Restart would open charCreate without pre-selection — minor UX issue, not a blocker |

A1 confidence is HIGH — the claim was verified directly against charCreate.js:57-71 (`isSelected === book.number` check in renderModalBookList). Tagged as assumed only in the architecture section for traceability.

**Effective assumption log: empty** — all claims verified against source files.

---

## Open Questions

None. All decisions are locked in CONTEXT.md. All code touchpoints are confirmed by direct file inspection. The UI-SPEC resolves the two "Claude's Discretion" items (confirm text, error handling).

---

## Sources

### Primary (HIGH confidence)
- `js/app.js:524-558` — bindEvents() pattern, New Adventure template, manual defeat confirm pattern
- `js/app.js:492-519` — `_applyNewCharacter()` — confirms it overwrites any existing session
- `js/ui/charCreate.js:57-71, 99` — showCharCreate() API, pre-selection behavior
- `js/storage.js` — existing save/load/clear pattern; deleteSession goes here
- `backend/routers/sessions.py:110-116` — DELETE endpoint confirmed, returns 204
- `index.html:28-31` — button state (disabled, classes missing)
- `css/style.css:484-515, 1396-1413` — mechanic-btn classes confirmed; --danger:hover absent

### Secondary (MEDIUM confidence)
- `.planning/phases/11-recovery-actions/11-CONTEXT.md` — locked decisions, canonical refs
- `.planning/phases/11-recovery-actions/11-UI-SPEC.md` — resolved discretion items, CSS audit

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all existing
- Architecture: HIGH — verified against source files directly
- Pitfalls: HIGH — derived from verified code inspection

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable codebase, no third-party API churn)
