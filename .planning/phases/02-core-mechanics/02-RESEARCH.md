# Phase 2: Core Mechanics - Research

**Researched:** 2026-03-29
**Domain:** Vanilla JS UI modules, Fighting Fantasy stat generation, modal flow, luck test display
**Confidence:** HIGH — all findings drawn directly from reading the actual source files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Flow sequence: Book → Roll → Name → Confirm.
- **D-02:** If selected book already has a game: show confirmation dialog with existing stats.
- **D-03:** `showBookModal(true)` call → becomes `showCharCreate(onComplete)`.
- **D-04:** Dice roll triggered by manual "Roll!" button, not auto-rolled on open.
- **D-05:** No re-rolls — first roll stands; "Roll!" button disabled/hidden after rolling.
- **D-06:** Individual die values must be visible as separate `.die-face` elements.
- **D-07:** Replace `#tests-result` with styled luck result using UI-SPEC treatment (Caveat 24px bold, accent-red for Lucky).
- **D-08:** Show 2d6 die face values alongside the luck result.
- **D-09:** `mechanics.testLuck()` already handles luck deduction; sync updated luck from returned session.
- **D-10:** New "Dice" section below the Tests section. Separate section.
- **D-11:** 2d6: two separate `.die-face` bubble elements plus total. 1d6: single die face.
- **D-12:** `renderDiceRoller(container)` in `js/ui/diceRoller.js` called from `app.js` with section container.
- **D-13:** Character name displays below book title in sheet header.
- **D-14:** If no name entered, name line hidden entirely.
- **D-15:** Name stored in backend `Session.name` field.

### Claude's Discretion
- Exact die animation style (keep it readable; speed over elaborateness)
- CSS class names for die faces (must match `die-face` pattern from UI-SPEC)
- How `showCharCreate` is inserted into `app.js`
- Whether to reuse or replace `#tests-result` vs add a dedicated element for luck

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 2 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAR-01 | User can initiate character creation and see dice rolled with individual die values visible | `rollInitialStats()` returns totals only — must roll dice individually and store die values; die-face UI components defined in UI-SPEC |
| CHAR-02 | User can select which FF book before stats are finalised | Book selection is step 1 in D-01 flow; existing `showBookModal` / `searchBooks` / `renderBookList` infrastructure reusable |
| CHAR-03 | User can enter optional character name | Backend `Session.name` column confirmed present; `SessionCreate` schema does NOT include `name` — requires backend fix or PATCH after creation |
| CHAR-04 | Stats generated per FF rules: Skill=1d6+6, Stamina=2d6+12, Luck=1d6+6 | `dice.js rollInitialStats()` already implements correct FF rules; reuse as-is |
| CHAR-05 | Character creation activates book-specific mechanics section for supported books | `js/config/mechanics/registry.js` exists but all entries commented out (Phase 4 work); Phase 2 only needs to show the inline note if config exists — no real activation needed yet |
| LUCK-01 | User can Test Luck at any time via dedicated button | Button already exists at `#test-luck`; `testLuck()` fully implemented in `mechanics.js` |
| LUCK-02 | Result displayed clearly as "Lucky" or "Unlucky" with 2d6 roll shown | Current `#tests-result` shows it as plain text; requires styled replacement with die faces |
| LUCK-03 | Current Luck decreases by 1 and updates visibly after every test | `testLuck()` handles deduction server-side; `syncStateFromServer()` updates the display; already working — just needs visual upgrade |
| DICE-01 | User can roll 1d6 or 2d6 from standalone widget | New section in `index.html`; `renderDiceRoller(container)` stub in `js/ui/diceRoller.js` to implement |
| DICE-02 | Individual die values shown (not just total for 2d6) | `roll()` from `dice.js` can be called per-die; display via `.die-face` elements defined in UI-SPEC |
</phase_requirements>

---

## Summary

Phase 2 adds three self-contained user-facing features on top of a well-structured existing codebase. The infrastructure (stat rendering, book selection modal, mechanics functions, backend session API) is fully operational — Phase 2 is primarily a UI layer task.

The largest complexity is the character creation flow: it reuses the existing book modal infrastructure but must be restructured as a multi-step sequence inside `showCharCreate()`. Individual die value display requires rolling dice separately (the existing `rollInitialStats()` returns totals only) and storing the individual die values for animation/display.

The luck test upgrade is straightforward: the backend already handles everything correctly, the current `#tests-result` paragraph just needs to be replaced with a properly styled element. The dice roller widget is a pure new addition with no integration risk.

**Primary recommendation:** Implement in three discrete plans — charCreate module, luck test UI upgrade, dice roller widget — with a fourth plan for `app.js` wiring and `index.html` changes.

---

## Codebase State

### Files That Exist and Their Condition

| File | State | Notes |
|------|-------|-------|
| `js/ui/charCreate.js` | Stub — exports empty `showCharCreate(onComplete)` | Lines 1–7; ready to implement |
| `js/ui/diceRoller.js` | Stub — exports empty `renderDiceRoller(container)` | Lines 1–7; ready to implement |
| `js/dice.js` | Complete | `roll(sides=6)`, `rollMultiple(count, sides=6)`, `rollInitialStats()` all exported |
| `js/mechanics.js` | Complete | `testLuck(bookNumber, luckCurrent)` fully implemented; returns `{roll, target, success, luckAfter, session}` |
| `js/ui/stats.js` | Complete | Module pattern reference; receives state+callbacks; no circular imports |
| `js/app.js` | Operational | Contains the "New Adventure" click handler and luck test handler that need modification |
| `index.html` | Operational | Has `#tests-result`, `#book-title`, no dice section, no char-name element |
| `css/style.css` | Operational | No `.die-face`, `.luck-result`, `.dice-roller-result` classes yet — all need adding |
| `backend/models.py` | Complete | `Session.name` column confirmed: `name = Column(Text, nullable=True)` (line 26) |
| `backend/schemas.py` | Gap | `SessionResponse` does NOT include `name` field; `SessionCreate` does NOT include `name` |
| `js/config/mechanics/registry.js` | Stub | All entries commented out — only used in Phase 4; CHAR-05 note is display-only in Phase 2 |

### Exact Integration Points in `app.js`

| Location | Line | Current Code | Phase 2 Change |
|----------|------|-------------|----------------|
| New Adventure button handler | 259 | `newGameBtn.addEventListener('click', () => showBookModal(true))` | Replace body with `showCharCreate(onComplete)` call |
| `#tests-result` luck handler | 339–355 | Sets `testsResult.textContent` with plain string | Replace with structured die-face + result label HTML |
| `render()` function | 189–192 | Calls `renderBookTitle()` + `renderStats(state)` | Add `renderCharName()` call |
| `renderBookTitle()` | 197–207 | Sets `#book-title` text content | Keep as-is; name renders in a sibling element |
| `init()` function | 37–54 | Loads state, calls `render()`, `bindEvents()`, may call `showBookModal(false)` | Add `renderDiceRoller` call; possibly call `showCharCreate` if no book on first load |
| `syncStateFromServer()` | 214–222 | Patches current values from session, re-renders | Does NOT handle `name` — acceptable (name set at creation only) |

### The `isSelectingForNewGame` Pattern

`app.js` uses the module-level boolean `isSelectingForNewGame` (line 25) to differentiate "new game" from "switch book" within `selectBook()`. The `showCharCreate` replacement will internalise this distinction — `isSelectingForNewGame` can remain in `app.js` for the "Switch Book" path but the `showBookModal(true)` call at line 259 becomes `showCharCreate(onComplete)`.

The `selectBook()` function (lines 107–160) contains the existing "confirm overwrite" dialog and the `rollInitialStats()` call. This logic moves into `charCreate.js`. The `selectBook()` function will still be needed for the "Switch Book" flow (non-new-game path).

### `testLuck()` Return Shape

From `js/mechanics.js` lines 41–49:
```
{ roll, target, success, luckAfter, session }
```
- `roll` — the 2d6 total (integer)
- `target` — luckCurrent at time of test
- `success` — boolean (roll <= target)
- `luckAfter` — Math.max(0, luckCurrent - 1)
- `session` — SessionResponse object or null (null when backend unavailable)

`roll` is a total, not individual die values. The luck test display requires individual die values — these must be rolled locally (two separate `roll(6)` calls whose sum equals the total). The simplest approach: roll d1 and d2 separately in the click handler before calling testLuck, pass the pre-computed roll into the display while letting `testLuck` use its own internal roll. **Risk:** the displayed dice and the actual test use different rolls. Mitigation: modify `testLuck` to accept an optional pre-rolled value, or roll separately and reuse the same values.

### `rollInitialStats()` — Die Value Gap

`rollInitialStats()` (lines 32–38 of `dice.js`) returns totals:
```js
{ skill: roll(6) + 6, stamina: rollMultiple(2, 6) + 12, luck: roll(6) + 6 }
```
Individual die values are not exposed. For CHAR-01 display, implementation must roll dice individually:
- Skill: `d1 = roll(6)`, skill = d1 + 6
- Stamina: `d1 = roll(6)`, `d2 = roll(6)`, stamina = d1 + d2 + 12
- Luck: `d1 = roll(6)`, luck = d1 + 6

The `rollInitialStats()` function should NOT be modified (it is used elsewhere without issue). `charCreate.js` calls `roll()` directly for the creation flow.

### Backend `name` Field Gap

`Session.name` exists in the ORM model (confirmed). However:
- `SessionCreate` schema (line 41–47 of `schemas.py`) does NOT include `name`
- `SessionResponse` schema (line 11–38 of `schemas.py`) does NOT include `name`
- `PUT /api/sessions/{book_number}` upsert handler does NOT write `name` (lines 54–80 of `sessions.py`)
- `PATCH /api/sessions/{book_number}` handler does NOT write `name` (lines 83–102 of `sessions.py`)

**This is a backend gap that must be addressed in Phase 2.** Two options:

1. Add `name: str | None = None` to `SessionCreate`, `SessionResponse`, and `SessionUpdate`; update `upsert_session` and `patch_session` to write it.
2. Use PATCH after creation with a dedicated name field.

Option 1 is cleaner and aligns with D-15. The planner must include a backend task to expose `name` through the API before the frontend can store it.

### Modal CSS

The existing `.modal-overlay` / `.modal` CSS (lines 273–301 of `style.css`) is fully reusable for the charCreate modal. The `.modal-cancel` class (lines 389–407) covers the "Keep current character" secondary action. No new modal container styles are needed — only the inner content layout classes listed in the UI-SPEC component inventory.

---

## Implementation Approach

### Character Creation Flow (`js/ui/charCreate.js`)

The module is a self-contained modal controller. Recommended structure:

1. **On entry** (`showCharCreate(onComplete)`): create and inject a modal overlay into `document.body`, then wire up the multi-step content.
2. **Step 1 — Book selection**: render `.book-search` + `.book-list` + `.book-item` elements using the same pattern as `app.js renderBookList()`. Do not import `app.js`; the book search utilities (`searchBooks`, `getBook`) are importable from `js/books.js` directly.
3. **Step 2 — Roll**: display three `.char-create-dice-row` rows with die face placeholders. Show "Roll!" button. On click: call `roll()` for each die individually, animate (60ms interval for 600ms cycling random values, then snap to result), disable the Roll button.
4. **Step 3 — Name**: text input with placeholder "Adventurer" using `.book-search` class (reuses existing style).
5. **Confirm button** ("Begin Adventure", `.mechanic-btn--primary`): collects book number, stats object, name; checks if existing game exists (query `games` state passed in via callback context); shows overwrite warning inline if needed; calls `onComplete(bookNumber, stats, name)`.
6. **Cancel** ("Keep current character"): only shown if a session already exists; closes modal without calling `onComplete`.

The `onComplete` callback signature is `onComplete(bookNumber, stats, name)` where `stats = {skill: {initial, current}, stamina: {initial, current}, luck: {initial, current}}`.

In `app.js`, the "New Adventure" handler becomes:
```js
newGameBtn.addEventListener('click', () => {
    showCharCreate(async (bookNumber, stats, name) => {
        // create/overwrite session
        // save and render
    });
});
```

The module receives `games` and `currentBook` state via the closure in `app.js`, or these can be passed as arguments. Given the no-circular-imports rule, passing them as parameters is cleaner.

### Luck Test UI Upgrade (`app.js` luck handler)

The existing handler (lines 339–355 of `app.js`) already calls `testLuck()` correctly. The only change is in the display block. The `#tests-result` element can be repurposed or a sibling element added.

Recommended: keep `#tests-result` in `index.html` for Skill/Stamina test output, add a `#luck-result` element specifically for luck test output. This avoids risk of breaking the Skill/Stamina handlers.

The luck result handler needs individual die values. Approach: roll two dice in the handler before calling `testLuck`, sum them, pass the sum as the roll parameter, and display the individual values. Since `testLuck` uses `rollMultiple(2)` internally, there will be a mismatch unless `testLuck` is modified to accept a pre-rolled value. The cleanest fix: add an optional `preRoll` parameter to `testLuck()` in `mechanics.js`.

Alternatively, keep `testLuck` unchanged and accept that displayed dice are cosmetic (rolled locally for display; actual test uses the function's own roll). This is the simpler path and does not affect game correctness since both are random.

### Dice Roller Widget (`js/ui/diceRoller.js`)

Fully isolated. `renderDiceRoller(container)` builds the HTML content into `container` and binds click events. Imports `roll` from `js/dice.js`. No state, no callbacks to `app.js`. Called once during `init()`.

```js
// In app.js init():
const diceSection = document.getElementById('dice-section');
if (diceSection) renderDiceRoller(diceSection);
```

### `index.html` Changes Required

1. Add `<p class="char-name" id="char-name"></p>` below `#book-title` in `.sheet-header`.
2. Add dice roller section after `.tests-section`:
   ```html
   <section class="mechanics-section dice-section" id="dice-section">
       <h2 class="mechanics-title">Dice</h2>
       <!-- renderDiceRoller() populates this -->
   </section>
   ```
3. `#tests-result` can remain as-is; add `<div id="luck-result" class="luck-result" aria-live="polite"></div>` after the test buttons.

### CSS Changes Required

All new classes are additive — no existing classes modified. Add to `css/style.css`:

- `.char-name` — Caveat 16px, `--ink-light`, text-align center, hidden by default (`display: none`)
- `.char-create-dice-row` — flex row, gap 8px, align-items center
- `.die-face` — 40×40px, border: 2px solid `--ink-color`, border-radius: 4px, Caveat 28px bold, display flex, align center+justify center
- `.die-face.rolling` — opacity: 0.6 pulse animation
- `.luck-result` — Caveat 16px base (inherits `.mechanic-result` structure)
- `.luck-result--lucky` — color: `--accent-red`, font-weight: 700, font-size: 24px
- `.luck-result--unlucky` — color: `--ink-color`, font-weight: 400, font-size: 24px
- `.dice-roller-result` — flex row, gap 8px, margin-top: 12px, align-items center
- `.dice-value` — Caveat 28px bold, `--ink-color`
- `.dice-total` — Caveat 24px regular, `--ink-light`

---

## Risks and Mitigations

### Risk 1: `testLuck()` rolls internally — cannot display individual dice from the actual test roll

**What goes wrong:** `testLuck()` calls `rollMultiple(2)` internally. The handler in `app.js` cannot access the individual die values from that internal call — only the 2d6 total is returned.

**Impact:** LUCK-02 requires showing 2d6 die values. Without individual values, cannot render die faces.

**Mitigation (recommended):** In the luck test click handler, roll `d1 = roll(6)` and `d2 = roll(6)` locally for display, sum them for the total shown in die faces. Accept that `testLuck` uses its own independent internal roll. Both are random — game correctness is unaffected. This avoids modifying `mechanics.js`.

**Alternative mitigation:** Add optional `preRoll` param to `testLuck(bookNumber, luckCurrent, preRoll?)`. If provided, skip internal roll and use it. Requires modifying `mechanics.js` but keeps die display and test result perfectly in sync. Planner can choose; both are valid.

### Risk 2: `SessionCreate` and `SessionResponse` do not include `name`

**What goes wrong:** `PUT /api/sessions/{book}` does not write `name` to the database even though the column exists. The frontend cannot persist character names through the standard save path.

**Impact:** CHAR-03 cannot be completed without a backend fix.

**Mitigation:** Include a backend task in the plan: add `name: str | None = None` to `SessionCreate`, `SessionResponse`, and `SessionUpdate` schemas; update `upsert_session` to write it; update the `assemble_stat_blocks` validator in `SessionResponse` to include it. This is a small, well-bounded change.

### Risk 3: `showCharCreate` must not import `app.js` (no circular imports, D-17)

**What goes wrong:** `charCreate.js` needs access to the current `games` state to detect existing sessions, and needs to trigger `save()`. Importing `app.js` would create a circular dependency.

**Impact:** Clean module boundaries at risk if implemented carelessly.

**Mitigation:** Pass `games`, `currentBook`, and a `save` callback as parameters to `showCharCreate`. Signature: `showCharCreate({ games, currentBook, save, onComplete })`. This matches the established pattern in `ui/stats.js` (receives state and callbacks as arguments).

### Risk 4: Book selection inside `charCreate` duplicates `app.js` book modal logic

**What goes wrong:** `charCreate.js` needs a book search UI. Re-implementing renderBookList inline would duplicate code.

**Impact:** Maintenance burden; DRY violation.

**Mitigation:** The book search utilities `searchBooks()` and `getBook()` are importable from `js/books.js` directly. Duplicate only the DOM construction (3–4 lines of template literal), not the utility logic. This is acceptable duplication given the module boundary constraint.

### Risk 5: `charCreate` modal cleanup if user navigates away

**What goes wrong:** If `showCharCreate` injects a modal overlay into `document.body`, it must remove it cleanly when cancelled or completed. If not removed, orphaned DOM elements accumulate.

**Mitigation:** `showCharCreate` creates a single overlay element, binds a `cleanup()` function internally, and calls it on both confirm and cancel paths before calling `onComplete`. Standard modal pattern.

### Risk 6: CHAR-05 book-specific mechanics activation

**What goes wrong:** CHAR-05 requires character creation to "activate book-specific mechanics section for supported books." The `js/config/mechanics/registry.js` has all entries commented out (Phase 4 work). There are no book config files yet.

**Impact:** CHAR-05 appears blocked.

**Clarification:** The UI-SPEC (line 109) describes CHAR-05 as "a brief inline confirmation appears below the book list" — informational only. Since `CONFIG_REGISTRY` is empty, the inline note simply never appears. The requirement is satisfied by implementing the check and display logic; it just never triggers until Phase 4 adds configs. No Phase 4 work is required in Phase 2 to satisfy CHAR-05.

---

## Architecture Patterns

### Module Pattern (from `js/ui/stats.js`)

All `js/ui/*.js` modules follow this contract:
- Export named functions only
- Accept state and callbacks as function parameters
- Never import `js/app.js`
- Importable from `js/dice.js`, `js/books.js`, `js/mechanics.js` (no circular risk)

`charCreate.js` and `diceRoller.js` must follow this same pattern.

### Backend Sync Pattern (from `app.js` / `mechanics.js`)

```
1. User action
2. Call mechanics function (e.g., testLuck)
3. Receive { ..., session } back
4. If session: call syncStateFromServer(session)
5. If no session (offline): apply mutation locally
```

This pattern is established and working. The luck test UI upgrade extends it without breaking it.

### Die Face Animation

UI-SPEC specifies: generate final result before animation, cycle random values via `setInterval` at 60ms intervals for 600ms total, then snap to real value. No CSS keyframes needed. Recommended implementation:

```js
function animateDieFace(el, finalValue, onDone) {
    const duration = 600;
    const interval = 60;
    let elapsed = 0;
    const timer = setInterval(() => {
        el.textContent = Math.floor(Math.random() * 6) + 1;
        elapsed += interval;
        if (elapsed >= duration) {
            clearInterval(timer);
            el.textContent = finalValue;
            if (onDone) onDone();
        }
    }, interval);
}
```

This function is local to `charCreate.js` and not exported — it is display-only infrastructure.

---

## Plan Recommendations

### Plan A: Backend — Expose `name` in session API

**Scope:** `backend/schemas.py`, `backend/routers/sessions.py`
**Tasks:**
1. Add `name: str | None = None` to `SessionCreate`, `SessionResponse`, `SessionUpdate`
2. Update `assemble_stat_blocks` validator in `SessionResponse` to include `name`
3. Update `upsert_session` to write `body.name` to `session.name`
4. Update `patch_session` to write `body.name` if provided

**Why first:** Frontend creation flow depends on being able to persist the name via PUT.

### Plan B: CSS — Add Phase 2 component classes

**Scope:** `css/style.css`
**Tasks:**
1. Add `.die-face` and `.die-face.rolling`
2. Add `.char-create-dice-row`
3. Add `.char-name` (hidden by default)
4. Add `.luck-result`, `.luck-result--lucky`, `.luck-result--unlucky`
5. Add `.dice-roller-result`, `.dice-value`, `.dice-total`

**Why early:** All other plans depend on these classes being available for testing.

### Plan C: `js/ui/charCreate.js` — Character creation flow

**Scope:** `js/ui/charCreate.js` (full implementation of stub)
**Tasks:**
1. Implement `showCharCreate({ games, currentBook, save, onComplete })`
2. Modal injection and cleanup
3. Book selection step with search (import `searchBooks`, `getBook` from `books.js`)
4. Roll step: call `roll()` individually for each stat die, store die values, animate
5. Name input step
6. Confirm / destructive warning / cancel

### Plan D: `js/ui/diceRoller.js` — Standalone dice roller widget

**Scope:** `js/ui/diceRoller.js` (full implementation of stub)
**Tasks:**
1. Implement `renderDiceRoller(container)`
2. "Roll d6" button: single die face display
3. "Roll 2d6" button: two die face elements + total

### Plan E: `index.html` + `app.js` wiring

**Scope:** `index.html`, `js/app.js`
**Tasks:**
1. Add `#char-name` element to `.sheet-header` in `index.html`
2. Add `#dice-section` to `index.html` (after tests-section)
3. Add `#luck-result` element in tests-section
4. Replace `showBookModal(true)` at line 259 with `showCharCreate(...)` call
5. Update luck test handler (lines 339–355) to use `#luck-result` with die faces
6. Add `renderCharName()` helper and call from `render()`
7. Call `renderDiceRoller(document.getElementById('dice-section'))` in `init()`
8. Update `init()` to use `showCharCreate` when no `currentBook` on first load

**Dependency:** Plans A–D must complete before this wiring plan.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Book search in charCreate | Custom search implementation | Import `searchBooks()` from `js/books.js` directly |
| Stat generation | Custom dice logic | Import `roll()` from `js/dice.js` |
| Luck deduction | Custom backend call | `testLuck()` from `js/mechanics.js` — already handles server POST + offline fallback |
| Modal overlay CSS | New modal styles | Reuse `.modal-overlay` / `.modal` / `.modal-cancel` — already defined |
| Book list item HTML | New component | Reuse `.book-item` / `.book-number` / `.book-name` / `.book-status` pattern from `app.js renderBookList()` |

---

## Environment Availability

Step 2.6: No external dependencies beyond the project's own code. Phase 2 is purely frontend module implementation and CSS. SKIPPED.

---

## Sources

### Primary (HIGH confidence)
- Direct source reads: `js/app.js`, `js/dice.js`, `js/mechanics.js`, `js/ui/stats.js`, `js/ui/charCreate.js`, `js/ui/diceRoller.js`
- Direct source reads: `index.html`, `css/style.css`
- Direct source reads: `backend/models.py`, `backend/schemas.py`, `backend/routers/sessions.py`
- Direct reads: `.planning/phases/02-core-mechanics/02-CONTEXT.md`, `.planning/phases/02-core-mechanics/02-UI-SPEC.md`
- Direct reads: `.planning/REQUIREMENTS.md`, `js/config/mechanics/registry.js`, `js/config/mechanics/default.js`

### Secondary
None — all findings from direct source inspection.

---

## Metadata

**Confidence breakdown:**
- Codebase state: HIGH — all files read directly; line numbers cited from actual source
- Backend gap (name field): HIGH — confirmed by reading `schemas.py` and `sessions.py`
- Architecture patterns: HIGH — derived from existing operational modules
- Pitfalls: HIGH — derived from reading actual code, not inference

**Research date:** 2026-03-29
**Valid until:** Until source files change — re-verify if `mechanics.js`, `schemas.py`, or `app.js` are modified before planning begins
