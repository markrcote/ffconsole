# Phase 2: Core Mechanics - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Three user-facing capabilities added to the adventure sheet:
1. **Character creation flow** — User taps "New Adventure", picks a book, rolls dice with individual values visible, enters an optional name, confirms → fully initialised adventure sheet with backend session
2. **Test Your Luck upgrade** — Existing luck test button shows "Lucky!" or "Unlucky." prominently with 2d6 die values, and luck decreases by 1 visibly (backend already handles the stat mutation)
3. **Standalone dice roller widget** — New section on the adventure sheet with Roll d6 and Roll 2d6 buttons, showing individual die face values for 2d6

Combat (Phase 3) and book-specific config data (Phase 4) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Character Creation Flow

- **D-01:** Flow sequence: Book → Roll → Name → Confirm. User picks which book first (aligns with CHAR-02: "book selected before stats finalised"), then sees dice roll with individual values, enters an optional name, then confirms.
- **D-02:** If the selected book already has a game in progress: show a confirmation dialog with existing stats, asking "Start a new adventure? Progress will be lost." This preserves the current `app.js` behaviour — do not silently overwrite.
- **D-03:** Replaces the current `showBookModal(true)` call in `app.js` → becomes `showCharCreate(onComplete)` which handles the full flow internally.

### Dice Roll in Character Creation

- **D-04:** Dice roll triggered by a manual "Roll!" button inside the creation flow — not auto-rolled when the modal opens. User sees the button first, taps it to generate their character.
- **D-05:** No re-rolls — once rolled, the stats are locked. First roll stands (FF rules). The "Roll!" button becomes disabled or hidden after rolling; only "Confirm" is available.
- **D-06:** Individual die values must be visible for each stat (CHAR-01). Show each die result as a separate `die-face` element (40×40px bordered bubble, Caveat 28px bold per UI-SPEC). For Stamina (2d6+12): show both d6 values separately.

### Test Your Luck Display

- **D-07:** "Lucky!" / "Unlucky." result must be shown clearly (LUCK-02). The existing `#tests-result` paragraph is not prominent enough — replace with a styled result that uses the UI-SPEC's luck result treatment (Caveat 24px bold, accent red for Lucky).
- **D-08:** Show the two 2d6 die face values alongside the result so the player can see what was rolled.
- **D-09:** Luck decreases by 1 after every test regardless of result (LUCK-03). `mechanics.testLuck()` already handles this via the backend — sync the updated luck value from the returned session.

### Dice Roller Widget

- **D-10:** New "Dice" section below the Tests section on the adventure sheet. Separate section, not merged into Tests — Tests are mechanic-driven (consume stats), dice roller is a utility.
- **D-11:** For 2d6: show two separate `die-face` bubble elements plus the total. Same die-face visual pattern used in character creation. For 1d6: single die face element.
- **D-12:** `renderDiceRoller(container)` in `js/ui/diceRoller.js` renders the section content. Called from `app.js` with the section container.

### Character Name Display

- **D-13:** Character name displays below the book title in the sheet header (small line beneath `#N: Book Title`). Visible throughout the session.
- **D-14:** If no name was entered, the name line is hidden entirely — no placeholder text, no empty space. Clean header.
- **D-15:** Name is stored in the backend session's `name` field (added to the Session model in Phase 1).

### Claude's Discretion

- Exact die animation style (tumbling numbers vs immediate reveal) — keep it readable; speed is more important than elaborateness
- CSS class names for die faces in the creation modal and dice roller (should match pattern from UI-SPEC: `die-face` class with Caveat 28px bold)
- How `showCharCreate` is inserted into `app.js` (replace the `isSelectingForNewGame` / `showBookModal(true)` path)
- Luck result display element — whether to reuse or replace `#tests-result` vs add a dedicated element

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 Requirements
- `.planning/REQUIREMENTS.md` — CHAR-01, CHAR-02, CHAR-03, CHAR-04, CHAR-05, LUCK-01, LUCK-02, LUCK-03, DICE-01, DICE-02

### UI Design Contract
- `.planning/phases/02-core-mechanics/02-UI-SPEC.md` — Spacing, typography, color, copywriting, component inventory, interaction contracts for all Phase 2 features

### Stubs to Implement
- `js/ui/charCreate.js` — `showCharCreate(onComplete)` entry point (stub)
- `js/ui/diceRoller.js` — `renderDiceRoller(container)` entry point (stub)

### Reusable Existing Code
- `js/dice.js` — `rollInitialStats()`, `roll()`, `rollMultiple()` — use as-is, do not duplicate
- `js/mechanics.js` — `testLuck()` fully implemented; reuse directly (handles backend POST + returns roll/success/luckAfter)
- `js/ui/stats.js` — rendering pattern reference for module structure and callback conventions

### App Integration Points
- `js/app.js` — `showBookModal(true)` call in "New Adventure" handler → replace with `showCharCreate()`; `syncStateFromServer()` for luck update after test
- `index.html` — existing HTML to extend: add dice roller section, name display in header

### Backend
- `backend/models.py` — Session model; confirm `name` field exists (added in Phase 1)
- `backend/routers/sessions.py` — `PUT /api/sessions/{book}` for saving name + stats

### Project Context
- `.planning/PROJECT.md` — core value, constraints (vanilla JS, no build step, mobile-first)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dice.js rollInitialStats()` — returns `{ skill, stamina, luck }` totals; Phase 2 needs to expose individual die values too (e.g. roll die separately and store them for display)
- `mechanics.js testLuck()` — fully working, just needs a better UI to display its results
- `app.js syncStateFromServer()` — already syncs luck after testLuck; reuse for the updated display

### Established Patterns
- Module signature: `ui/*.js` receive state/callbacks as arguments; never import `app.js` (D-17 from Phase 1)
- Backend sync: call `mechanics.*()` → get `{ session }` back → call `syncStateFromServer(session)` to update local state and re-render
- Error fallback: if backend unavailable, apply stat mutations locally (see testLuck offline fallback in app.js)

### Integration Points
- `app.js` "new-game" button click handler → call `showCharCreate(onComplete)` instead of `showBookModal(true)`
- After `showCharCreate` completes: `onComplete(bookNumber, stats, name)` → `app.js` saves state, calls `render()`
- `renderDiceRoller(container)` called once during `init()` after DOM is ready

</code_context>

<specifics>
## Specific Ideas

- Die faces should match between character creation modal and the standalone dice roller — consistent visual language throughout the app
- The "Roll!" button in character creation becomes unavailable after first roll (FF rules — no re-rolls)
- Luck result should visually pop — "Lucky!" in accent red is the most satisfying feedback moment in the game

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 02-core-mechanics*
*Context gathered: 2026-03-29*
