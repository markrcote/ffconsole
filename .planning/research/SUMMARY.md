# Project Research Summary

**Project:** FF Console — Fighting Fantasy Adventure Sheet
**Domain:** Vanilla JS gamebook companion with combat system and extensible book mechanics
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

FF Console is a single-page vanilla JS web app that currently tracks Skill/Stamina/Luck for Fighting Fantasy gamebooks. The research consensus is clear: add a proper combat panel with a turn-by-turn log, character creation flow, and book-specific mechanic configs — all without adding any libraries or build steps. The codebase is sound but `app.js` has grown monolithic and needs a deliberate module split before new features are layered on top. The recommended approach is to refactor the module boundary first, then build features in layers: config infrastructure, character creation, core mechanics polish, battle system, then book-specific configs.

The biggest architectural decisions are already settled by the research. Combat state lives in a dedicated `ui/battle.js` module (not polluting the root game state), round logs persist to the existing ActionLog backend endpoint, and book-specific mechanics are driven by lazy-loaded config files (one per book) rather than hard-coded HTML. The pattern for rendering dynamic panels without a framework is innerHTML replacement with delegated event binding — no diffing, no virtual DOM, no reactive library.

The critical risks are all known and preventable. Three pitfalls must be addressed before writing any feature code: split-brain combat state (player vs. enemy Stamina during a fight), double stat mutation on luck tests (optimistic local update + server response = double decrement), and book-specific stat fields being silently stripped by Pydantic schemas (requires a `mechanics_json` backend column before any book config ships). Address these three in Phase 1 and the rest of the build is low-risk.

---

## Key Findings

### Recommended Stack

Zero new dependencies. Every required feature — FSM, dice animation, collapsible logs, config loading — is covered by native browser APIs and the existing ES module pattern. The project stays a static HTML/CSS/JS app with a FastAPI backend. No npm, no build step, no framework.

The one structural addition is a homegrown signal-style store (~30 lines) for combat state management, using `structuredClone` to prevent accidental mutation and a callback Set for subscriptions. For rendering panels, innerHTML replacement is preferred over incremental DOM manipulation because panels are small enough that full re-render is simpler and correct.

**Core technologies:**
- Vanilla JS (ES modules): all logic — no framework overhead, matches existing codebase
- CSS `@keyframes` + `animationend`: dice animation — GPU-accelerated, no canvas library needed
- Native `<details>`/`<summary>`: collapsible round log — zero JS, accessible
- Dynamic `import()`: lazy-loading book configs — only downloads config for selected book
- `insertAdjacentHTML('beforeend', ...)`: appending round log entries — O(1), no flicker
- FastAPI + SQLite (existing): persistence — extend existing ActionLog model for round logs

### Expected Features

**Must have (table stakes):**
- Character creation flow: dice roll animation showing individual die values, name entry, book selection
- Battle panel: round-by-round log with full Attack Strength breakdown (both rolls, who won, damage)
- Battle log persistence to backend — survives page reload and device switches
- Live Stamina display for player and enemy during combat
- Post-battle summary (won/fled/lost, rounds, damage dealt/received)
- Test Your Luck: clear Lucky/Unlucky result, new Luck value shown immediately
- Standalone dice roller: 1d6 and 2d6 with individual die values

**Should have (differentiators):**
- Full AS breakdown in round log (not just outcome)
- Visual enemy Stamina bar showing fight progress
- Book-specific mechanics auto-applied on book selection (Books 17, 30, 13)
- Flee penalty: -2 Stamina (currently unimplemented)
- Provisions tracker (book-config-driven)
- Combat history: review previous battles from current session

**Defer to v2+:**
- User-configurable book mechanics (schema design is complex)
- Animated 3D dice (complexity without added value)
- Undo/redo system
- Paragraph tracker
- Sound effects
- Non-FF gamebook systems

### Architecture Approach

The recommended module structure separates `app.js` into an orchestrator that owns root state, with feature panels (`ui/charCreate.js`, `ui/battle.js`, `ui/diceRoller.js`) that receive state slices and callbacks — never importing `app.js`. Book mechanics live in `config/mechanics/*.js` (one file per book), loaded lazily via a registry in `books.js`. This makes adding a new book config zero-HTML-change and avoids loading unused configs at startup.

**Major components:**
1. `app.js` — orchestrator: root game state, init, routes between views, calls `applyBookConfig()`
2. `ui/charCreate.js` — 3-step modal: book select, roll stats (animated), name confirm; calls back via `onCharCreated()`
3. `ui/battle.js` — battle panel: enemy input, turn log, live trackers; calls back via `onPlayerStaminaChange(delta)`
4. `ui/stats.js` — extracted from `app.js`; renders and binds the stat rows, no logic
5. `ui/diceRoller.js` — standalone widget; reads `dice.js`, writes DOM only, holds no state
6. `mechanics.js` — all FF rule computations and API POSTs; returns result objects, never touches DOM
7. `books.js` — catalog + `getBookConfig(number)` via dynamic import registry
8. `config/mechanics/*.js` — declarative per-book config objects (extraStats, resources, combatVariant)

### Critical Pitfalls

1. **Split-brain combat state** — Enemy Stamina is client-only; player Stamina lives on the server. Broken offline fallback reads pre-round Stamina. Fix: `ui/battle.js` owns all in-combat state and mutates player stats only via `onPlayerStaminaChange(delta)` callback to `app.js`. Never mutate player stats directly inside the battle module.

2. **Double stat mutation on Luck tests** — The offline fallback can fire on the same request the server also processes, decrementing Luck by 2. Fix: optimistic local update only. Apply the change locally, POST to server, roll back on error. Never apply the server response as an additional delta.

3. **Book mechanic fields silently stripped by Pydantic** — The current schema only knows `{ skill, stamina, luck }`. Extra fields are silently dropped on every save/load. Fix: add `mechanics_json` (TEXT/JSON) column to the `Session` model and a `mechanics: {}` sub-object to the state blob. Must be done before any book config feature ships.

4. **Global event listener accumulation** — Panel re-renders that add new `addEventListener` calls without removing old ones stack up. After 10 rounds, 10 handlers fire per click. Fix: one delegated listener per container, rebound after every `innerHTML` replacement. Never bind panel-specific actions to `document`.

5. **Mobile double-tap on combat buttons** — Without `touch-action: manipulation` on interactive buttons, mobile synthesises a delayed click after `touchstart`, firing two rounds. Fix: add `touch-action: manipulation` to the base button CSS from day one.

---

## Implications for Roadmap

### Phase 1: Config Infrastructure and Backend Schema
**Rationale:** Pitfall 3 is a data loss bug that corrupts any book-specific stats on every reload. This must be fixed before any book config code is written. Also establishes the data contract that all UI phases depend on.
**Delivers:** `mechanics_json` column in `Session` model; Pydantic schema updated; `config/mechanics/default.js` and config loader in `books.js`; `touch-action: manipulation` added to base button CSS (Pitfall 4 prevention).
**Addresses:** Schema extension for book mechanics, config loader pattern.
**Avoids:** Pitfalls 3, 4, and 9.

### Phase 2: Module Split (app.js Refactor)
**Rationale:** `app.js` currently owns everything. Adding battle.js and charCreate.js on top of an un-refactored app.js will create circular dependency risks and state leakage. This phase is zero user-visible change — pure internal restructuring.
**Delivers:** `ui/stats.js` extracted; `app.js` reduced to orchestrator role; boundaries between modules established; homegrown store pattern in place.
**Avoids:** Pitfall 1 (split-brain state), Pitfall 7 (listener accumulation).

### Phase 3: Character Creation
**Rationale:** Character creation is the prerequisite for meaningful play — users currently have no guided flow. Depends on Phase 1 config loader (to show book-specific choices) and Phase 2 module structure.
**Delivers:** `ui/charCreate.js` 3-step modal: book selection, animated dice roll with individual die values, name entry. Stats generated per FF rules and handed to `app.js` via `onCharCreated()` callback.
**Addresses:** Character creation table stakes; dice animation; `allowsStatReroll` config flag.
**Avoids:** Pitfall 5 (animation/result race — DOM updates in `animationend` callback), Pitfall 10 (re-roll rules vary by book).

### Phase 4: Core Mechanics Polish
**Rationale:** Luck tests and the standalone dice roller are quick wins with clear user value. The Luck double-mutation bug (Pitfall 2) should be fixed here before the battle panel adds more state-mutation complexity.
**Delivers:** Test Your Luck with clear Lucky/Unlucky display and immediate new Luck value; `ui/diceRoller.js` standalone roller (1d6 + 2d6, individual values); flee penalty (-2 Stamina) implementation.
**Avoids:** Pitfall 2 (double Luck mutation).

### Phase 5: Battle Panel
**Rationale:** Highest complexity feature; all prior phases are prerequisites. The module split (Phase 2) makes the boundary clean; the config schema (Phase 1) ensures player state persists correctly; character creation (Phase 3) means a named character with valid stats exists before combat starts.
**Delivers:** `ui/battle.js` with full round-by-round log (Attack Strength breakdown), live Stamina bars, enemy entry form, post-battle summary, and log persistence to ActionLog backend endpoint. Combat history on page reload.
**Addresses:** All battle system table stakes and differentiators.
**Avoids:** Pitfalls 1 (combat state boundary), 6 (innerHTML+= on log), 7 (listener accumulation), 8 (log not loading on reload).

### Phase 6: Book-Specific Configs
**Rationale:** Data files first — pure data, no UI risk. Then wire dynamic extra-mechanics section. Books ordered by complexity: Book 17 (AFEAR — simplest, extra stats only), Book 30 (Chasms of Malice — more stats/resources), Book 13 (Freeway Fighter — most complex, different combat AS math).
**Delivers:** `config/mechanics/book-17.js`, `book-30.js`, `book-13.js`; dynamic `#extra-mechanics` section rendered from config; vehicle combat variant for Freeway Fighter.
**Addresses:** Book-specific mechanics differentiators.
**Avoids:** Pitfall 9 (hard-coded book HTML — everything rendered from config data).

### Phase Ordering Rationale

- Schema fix (Phase 1) must precede any persistence of new data — otherwise data is silently lost on first reload.
- Module split (Phase 2) must precede panel implementation — panels need clean import boundaries to avoid circular dependencies.
- Character creation (Phase 3) before battle panel (Phase 5) — named character with rolled stats is prerequisite for combat setup.
- Core mechanics polish (Phase 4) can precede or follow Phase 3 but must precede Phase 5 to fix the Luck mutation bug before more state mutation is added.
- Book configs (Phase 6) last — pure data files with no dependencies; also the lowest table-stakes priority.

### Research Flags

Phases with standard, well-documented patterns (skip additional research):
- **Phase 2 (Module Split):** Pure refactor of existing code; patterns are clear from architecture research.
- **Phase 4 (Core Mechanics):** Luck test and dice roller are small, self-contained; no unknowns.
- **Phase 6 (Book Configs):** Config files are pure data; schema is fully defined in architecture research.

Phases that may benefit from deeper pre-implementation review:
- **Phase 5 (Battle Panel):** Most complex phase; integrates FSM, log persistence, backend ActionLog, and player stat callbacks. Worth reviewing the ActionLog router implementation before writing `ui/battle.js` to confirm the POST/GET shape expected.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations are zero-dependency, native API patterns — no version risk, no library churn |
| Features | HIGH | FF rules are fixed and well-documented; feature list derived from direct FF rulebook and codebase analysis |
| Architecture | HIGH | Module map derived from direct codebase inspection; patterns are established vanilla JS conventions |
| Pitfalls | HIGH | All pitfalls identified from direct codebase analysis of existing bugs and anti-patterns, not inference |

**Overall confidence:** HIGH

### Gaps to Address

- **ActionLog endpoint shape:** Research confirms the backend has an ActionLog model and router, but the exact POST/GET payload format for `combat_round` entries was not inspected in detail. Confirm `/api/sessions/{book}/actions` request/response shape before implementing round log persistence in Phase 5.
- **Flee mechanic (book-dependent free attack):** The -2 Stamina flee penalty is unimplemented. Whether the enemy gets a free attack on flee varies by book. The config schema should include a `fleeFreeAttack: boolean` field; current research flagged the absence but did not fully specify the config key. Resolve during Phase 1 config schema design.
- **Book 13 vehicle combat AS calculation:** Freeway Fighter uses Firepower (not Skill) for ranged AS. The exact formula is documented in FEATURES.md but the `combatVariant: 'vehicle'` branch in `ui/battle.js` will need the config to specify which stat drives AS. Verify the config schema covers this fully in Phase 1 before Phase 6 implements it.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis (`app.js`, `mechanics.js`, `storage.js`, `backend/schemas.py`, `backend/models.py`) — architecture, pitfalls, current state
- FF rulebook rules reference — combat AS formula, Luck test, Provisions, stat generation
- MDN Web Docs — `insertAdjacentHTML`, `<details>`, dynamic `import()`, `animationend`, `touch-action`

### Secondary (MEDIUM confidence)
- FF fan community references — book-specific mechanic details for Books 13, 17, 30

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
