# Phase 4: Book Configs — Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up book-specific mechanic configs for Book 17 (Appointment with F.E.A.R.) and Book 30 (Chasms of Malice). The adventure sheet dynamically renders each book's extra stats, resources, and trackers based on a config file. Players on unsupported books see the unmodified base sheet.

This phase delivers the config data files, the UI renderer for book mechanics, and the superpower selection step wired into the existing char create flow. It does NOT deliver user-configurable mechanics (future milestone).

</domain>

<decisions>
## Implementation Decisions

### Config Data Files

- **D-01:** Create `js/config/mechanics/book-17.js` with the full Book 17 (Appointment with F.E.A.R.) config.
- **D-02:** Create `js/config/mechanics/book-30.js` with the full Book 30 (Chasms of Malice) config.
- **D-03:** Uncomment both entries in `js/config/mechanics/registry.js` to activate the dynamic imports.

### Config Schema Extension

The existing schema (`extraStats`, `resources`) covers numeric stats and counters. Book 30's Spells list and Special Abilities require a new type. Extend the schema with:

- **D-04:** Add `checklists: Array<{ id, label, items: Array<{ id, label }> }>` to the config schema. Each checklist is a named group with individually checkable items. Stored in `mechanics` as a dict of `{ [checklistId]: { [itemId]: boolean } }`.
- **D-05:** `default.js` base config gets `checklists: []` added so existing code doesn't break.

### Book 17: Appointment with F.E.A.R.

- **D-06:** `extraStats`: Hero Points (numeric stat, adjustable with +/- buttons, initial TBD from book rules).
- **D-07:** `checklists`: One checklist for the 8 Clues — each clue has its real name from the book. Player checks off clues as discovered.
- **D-08:** Superpower uses a new config key `superpower: { options: string[] }` — not an extraStat, not a checklist. The selected value is stored in `mechanics.superpower` as a string. The 5 options are the real names from the book: Psi-Powers, Energy Blast, Flying, Super Strength, Laser Vision.

### Book 30: Chasms of Malice

- **D-09:** `extraStats`: Kuddam defeats counter (numeric, starts at 0, no max).
- **D-10:** `resources`: Provisions (numeric, adjustable), Fuel (numeric, adjustable). Use the `resources` config type already in the schema.
- **D-11:** Tabasha the Bazouk restoration: numeric counter via `extraStats` (0–4 range representing restoration steps completed).
- **D-12:** `checklists`: One checklist for Spells (named spells from the book, each checkable). One checklist for Special Abilities (named abilities from the book, each checkable).

### Superpower Selection (Book 17 only)

- **D-13:** Superpower is chosen **in the character creation flow** — a new step appears after name entry when the selected book has a `superpower` config key. The step shows the 5 options and the player picks one before finalising.
- **D-14:** Extend `charCreate.js` to detect `config.superpower` and render the picker step. The selected value is passed to `onComplete` alongside stats and name, then stored in `mechanics.superpower` by `_applyNewCharacter()` in `app.js`.
- **D-15:** If a player already has a Book 17 session (loaded from backend), the superpower display on the sheet is read-only. No in-sheet selector needed.

### Book Mechanics UI Renderer

- **D-16:** Create `js/ui/bookMechanics.js` — a new UI module following D-17 pattern (receives state + callbacks, does not import app.js). Exports `renderBookMechanics(container, bookConfig, state, onMechanicsChange)`.
- **D-17:** The renderer handles all mechanic types: `extraStats` (stat row with +/-), `resources` (resource row with +/-), `checklists` (labelled list with checkboxes), `superpower` (read-only display of selected value).
- **D-18:** Section placement: **below the stats section, above the Tests section** in `index.html`. A `<section class="mechanics-section book-mechanics-section" id="book-mechanics-section">` placeholder is added. The section is hidden (`hidden` attribute) when no book config is active; revealed and populated when a supported book is loaded.

### Persistence

- **D-19:** All book-specific values persist in `mechanics: {}` within the existing session blob. Keys follow the pattern `stat_{id}` for extraStats, `resource_{id}` for resources, `checklist_{checklistId}_{itemId}` for checklist items, and `superpower` for the superpower selection.
- **D-20:** On save, `app.js` serialises the full mechanics dict into the session and calls `save()`. On load, the mechanics dict is passed to `renderBookMechanics()` to restore state.

### Claude's Discretion

- Exact Hero Points initial value for Book 17 — look it up or use a sensible default if unknown.
- Exact spell names for Book 30 — use the actual names from the book if findable; otherwise sensible placeholder names.
- Exact special ability names for Book 30 — same as above.
- Exact clue names for Book 17 — use real names from the book if findable.
- CSS styling for the book mechanics section — follow existing `mechanics-section` / `mechanic-btn` patterns already in `style.css`.
- Whether to add a book-specific subtitle/header inside the mechanics section (e.g. "F.E.A.R. Mechanics" for Book 17).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Project Context
- `.planning/PROJECT.md` — core value, constraints, non-negotiables
- `.planning/REQUIREMENTS.md` — AFEAR-01 through AFEAR-03, CHAOS-01 through CHAOS-05 acceptance criteria

### Existing Code (read before touching)
- `js/config/mechanics/registry.js` — dynamic import registry (uncomment entries here)
- `js/config/mechanics/default.js` — base config schema (extend with `checklists: []`)
- `js/app.js` — `_applyNewCharacter()` and `render()` need wiring for book mechanics
- `js/ui/charCreate.js` — extend for superpower picker step (detect `config.superpower`)
- `index.html` — add `book-mechanics-section` placeholder between stats and tests sections
- `css/style.css` — follow existing `.mechanics-section` patterns; no new design language

### Prior Phase Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-12 (config schema), D-17 (no circular imports), D-11 (getBookConfig loader)
- `.planning/phases/02-core-mechanics/02-CONTEXT.md` — charCreate.js interface contract
- `.planning/phases/03-battle-system/03-CONTEXT.md` — battle.js D-17 pattern to follow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `js/config/mechanics/default.js` — base config; extend with `checklists: []`
- `js/config/mechanics/registry.js` — has commented stubs for books 17 and 30; just uncomment
- `js/ui/stats.js` — stat row render + +/- button pattern to reuse for `extraStats`
- `js/ui/battle.js` — example of D-17 module pattern with state + callbacks

### Established Patterns
- D-17: UI modules receive `(container, stateGetter, callbacks)` — never import app.js
- State shape: `mechanics: {}` already in every game session (set in `_applyNewCharacter` and `selectBook`)
- `save({ games, currentBook })` called after any state mutation
- CSS: `.mechanics-section` + `.mechanics-title` + `.mechanic-btn` classes already in style.css

### Integration Points
- `app.js init()` → `renderBookMechanics()` call after stats render, passing `getBookConfig(currentBook)`
- `app.js _applyNewCharacter()` → accept `superpower` from onComplete, store in `mechanics.superpower`
- `charCreate.js` → detect `config.superpower`, render picker step, pass selection in onComplete
- `index.html` → add `#book-mechanics-section` between `.stats-section` and `.tests-section`

</code_context>

<specifics>
## Specific Ideas

- Superpower options are the real 5 from the book: **Psi-Powers, Energy Blast, Flying, Super Strength, Laser Vision**
- Clue tracker is a named checklist (not a counter) — real clue names from the book
- Spells list is a named checklist — real spell names from Chasms of Malice
- Special abilities is a named checklist — real ability names from Chasms of Malice
- Tabasha restoration is a numeric counter (0–4 steps)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-book-configs*
*Context gathered: 2026-04-01*
