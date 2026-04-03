# Phase 6: Module Restructure and DOM Cleanup — Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the inline combat panel with a "Start Battle" trigger button grouped with the existing "Test Luck" button; refactor `battle.js` so all DOM queries are scoped to a container argument (no more `document.getElementById()`); create a `battleModal.js` skeleton that constructs the modal overlay, passes a container to `battle.js`, and shows the enemy setup form with hidden stubs for active combat and summary sections.

Requirements in scope: MODAL-01, MODAL-02, MODAL-03.
Requirements out of scope for this phase: MODAL-04 through MODAL-12 (Phase 7–8).

</domain>

<decisions>
## Implementation Decisions

### Trigger Button Placement
- **D-01:** The "Start Battle" button lives in the existing "Tests" section alongside "Test Luck". That section is renamed to **"Actions"** (class `actions-section` → keep as-is or rename consistently).
- **D-02:** The entire `combat-section` block in `index.html` (enemy setup form, stamina bars, round cards, all inline combat HTML) is **removed**. The combat-history-section (`<section id="combat-history-section">`) remains in `index.html` — it is already a separate section and continues to live on the sheet.
- **D-03:** "Start Battle" uses the same `mechanic-btn` style as "Test Luck" for visual consistency within the Actions section.

### battle.js DOM Query Migration
- **D-04:** **Full migration** — all `document.getElementById()` calls in `battle.js` are converted to `container.querySelector()` scoped to the container argument. No half-migrated state entering Phase 7. Global IDs (`player-stamina-fill`, `enemy-skill`, `combat-active`, etc.) are removed from `index.html`.
- **D-05:** `updateStaminaBars()` and all other helpers that currently query global IDs must be refactored to accept the container (or individual elements) as arguments.

### battleModal.js Skeleton
- **D-06:** New file `js/ui/battleModal.js` — follows the `charCreate.js` create-on-open / destroy-on-close pattern. On `openBattleModal()`, creates an overlay element, appends to `document.body`, calls `renderBattle(container, getState, callbacks)`.
- **D-07:** The modal's inner HTML includes the **full structure**: enemy setup form (visible) + `combat-active` section (hidden) + `combat-summary` section (hidden). Phase 7 wires the hidden sections — no HTML changes needed then.
- **D-08:** `openBattleModal(getState, callbacks)` is the exported function. `app.js` calls it from the "Start Battle" button click handler.

### Module Boundary (D-17 pattern)
- **D-09:** `battleModal.js` receives `getState` and `callbacks` as arguments — does not import `app.js`. The "Start Battle" event binding lives in `app.js`, which calls `openBattleModal(...)`.

### Claude's Discretion
- Exact CSS class name for the renamed section header text (e.g., `<h2>Actions</h2>` or keep `tests-section` class)
- Whether `updateStaminaBars()` refactor takes the container element or pre-queried element references as args
- Whether `battleModal.js` exports a `closeBattleModal()` stub for use in Phase 7 or leaves teardown to Phase 7

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured above and in project files.

### Project & Requirements
- `.planning/REQUIREMENTS.md` — MODAL-01, MODAL-02, MODAL-03 acceptance criteria
- `.planning/PROJECT.md` — Key Decisions table (D-17 pattern, modal lifecycle decisions)
- `CLAUDE.md` — Architecture overview, D-17 pattern, module responsibilities

### Existing Implementation
- `js/ui/battle.js` — full battle panel UI; all `document.getElementById()` calls to be migrated
- `js/ui/charCreate.js` — reference implementation for create-on-open / destroy-on-close modal pattern with `overlay.querySelector()`
- `js/app.js:71–89` — current `renderBattle()` wiring; wiring changes to `openBattleModal()` call
- `index.html:64–135` — current tests-section (to add Start Battle button + rename to Actions) and combat-section (to remove)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `charCreate.js` dynamic overlay pattern — creates `div.modal-overlay.active`, appends to body, uses `overlay.querySelector()` throughout, removes via `overlay.remove()`. `battleModal.js` should follow this exactly.
- `renderBattle(container, getState, callbacks)` — already has a container parameter; the signature is correct. The body needs all global ID lookups replaced with `container.querySelector()`.

### Established Patterns
- **D-17 callback pattern**: confirmed; `battleModal.js` must not import `app.js`
- **Global ID cleanup**: `index.html` currently defines IDs like `player-stamina-fill`, `enemy-skill`, `combat-active`, `combat-round-result`, `combat-summary`, `roll-round`, `flee-combat`, `start-combat`, `new-battle` — these all move into the modal-generated DOM

### Integration Points
- `app.js:71–74` — `renderBattle(combatSection, ...)` call replaced by wiring `#start-battle-btn` click → `openBattleModal(getState, callbacks)`
- `app.js:86–89` — `loadCombatHistory(currentBook, historyContainer)` stays unchanged — history section remains in `index.html`
- `index.html` tests-section — add `<button id="start-battle-btn">` next to `#test-luck`; rename h2 to "Actions"
- `index.html` combat-section — entire section removed (setup form, stamina bars, round result, all of it)

</code_context>

<specifics>
## Specific Ideas

- User confirmed: "Start Battle" button grouped with Test Luck (not a separate full-width section) — reduces visual footprint of combat trigger on sheet
- Section renamed from "Tests" to "Actions" — explicitly decided

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-module-restructure-and-dom-cleanup*
*Context gathered: 2026-04-03*
