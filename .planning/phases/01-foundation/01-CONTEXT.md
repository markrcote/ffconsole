# Phase 1: Foundation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure infrastructure — no new user-visible features. This phase:
1. Adds `mechanics_json` column to the Session model (backend schema)
2. Adds a config system (`js/config/mechanics/`) with schema and `getBookConfig()` loader
3. Migrates `storage.js` from the legacy `/api/state` compat shim to the proper `/api/sessions/{book}` API
4. Refactors `app.js` into focused modules with clean boundaries

No UI changes visible to the user. When this phase is complete, the codebase is structurally ready for Phase 2 (Core Mechanics) to add features.

</domain>

<decisions>
## Implementation Decisions

### Database Migration

- **D-01:** Recreate the database — drop and recreate `ff.db`. Existing game saves are not worth preserving. No ALTER TABLE or migration needed.
- **D-02:** No Alembic or migration tooling needed. A clean schema creation on startup is sufficient.

### Storage Layer

- **D-03:** Migrate `storage.js` from the legacy `/api/state` compat shim to `/api/sessions/{book}` — the proper sessions API that can carry `mechanics_json`.
- **D-04:** Delete the compat layer entirely — remove `backend/routers/compat.py` and unregister it from `main.py`. Clean break, no dead code.
- **D-05:** The compat shim's `LegacyStateBlob`, `LegacyGameEntry`, `LegacyStatBlock` Pydantic schemas in `schemas.py` should also be removed when compat.py is deleted.
- **D-06:** `storage.js` should be updated to call `GET /api/sessions` (list all), `PUT /api/sessions/{book}` (upsert), and include `mechanics: {}` in the payload shape.

### Backend Schema

- **D-07:** Add `mechanics_json` as a TEXT column (nullable, default `'{}'`) to the `Session` ORM model. This stores book-specific mechanic state as a JSON blob.
- **D-08:** Update `SessionCreate`, `SessionUpdate`, and `SessionResponse` Pydantic schemas to include a `mechanics: dict` field. Default `{}`.
- **D-09:** Update `compat.py` replacement: the `/api/sessions/{book}` PUT endpoint should handle upsert (create or update). Verify `routers/sessions.py` already has this.

### Config System

- **D-10:** Create `js/config/mechanics/` directory with:
  - `default.js` — base config (empty extraStats and resources, combatVariant: 'standard')
  - `registry.js` — dynamic import registry mapping book numbers to config files
  - Schema comment block documenting the config shape
- **D-11:** Add `getBookConfig(bookNumber)` to `books.js` (or a new `config.js`) using dynamic import via the registry. Falls back to default config for unknown books.
- **D-12:** Config schema (for all fields Phase 4 will use):
  ```js
  {
    bookNumber: number | null,
    extraStats: Array<{ id, label, initial, min, max }>,
    resources: Array<{ id, label, initial, min, max, step }>,
    combatVariant: 'standard',    // extensible later
    combatModifiers: {}
  }
  ```
- **D-13:** No actual book data files (book-17.js, book-30.js) in Phase 1 — just the schema, default, and registry wiring. Data files ship in Phase 4.

### App.js Module Split (Standard depth)

- **D-14:** Extract `ui/stats.js` — the stat row rendering and +/- button event binding logic currently in `app.js`. `app.js` calls `renderStats(container, state, callbacks)` instead.
- **D-15:** Create empty shells (export stubs, no implementation) for `ui/charCreate.js`, `ui/battle.js`, and `ui/diceRoller.js`. These establish the module contract for Phase 2 and 3 to implement.
- **D-16:** Do NOT refactor book modal, init flow, or remaining event binding in Phase 1 — those get touched naturally when Phase 2 implements charCreate.
- **D-17:** No circular imports allowed. Module rule: `ui/*.js` accept state/callback arguments; they do not import `app.js`.

### Mobile Touch Fix (from research pitfall)

- **D-18:** Add `touch-action: manipulation` to all interactive buttons in `css/style.css`. This eliminates the 300ms tap delay on mobile without requiring JS event handling changes. Apply broadly now so all future buttons inherit it.

### Claude's Discretion

- How to wire the sessions API in `storage.js` (exact fetch calls, error handling shape) — follow existing patterns in `storage.js` and `mechanics.js`.
- Whether to add a `name` field to the Session model for character name — this is needed by Phase 2 (character creation). Claude may include it here if it's a natural fit with the schema work, or defer to Phase 2.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Project Context
- `.planning/PROJECT.md` — core value, constraints, non-negotiables
- `.planning/REQUIREMENTS.md` — INFRA-01, INFRA-02, INFRA-03 acceptance criteria

### Existing Code (read before touching)
- `backend/models.py` — current Session and ActionLog ORM models
- `backend/schemas.py` — current Pydantic schemas (includes LegacyState* to delete)
- `backend/routers/compat.py` — compat shim to DELETE
- `backend/routers/sessions.py` — sessions CRUD (verify PUT upsert before touching storage.js)
- `js/app.js` — module to split (extract ui/stats.js)
- `js/storage.js` — storage layer to migrate off compat shim
- `js/books.js` — add getBookConfig() here or nearby

### Research
- `.planning/research/ARCHITECTURE.md` — module split patterns, config loader design
- `.planning/research/PITFALLS.md` — Pitfall 3 (Pydantic silently strips book fields), Pitfall 4 (mobile double-tap)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mechanics.js` — already has clean module boundaries; use as a pattern for `ui/stats.js`
- `backend/routers/sessions.py` — has CRUD for `/api/sessions`; verify it has PUT upsert before migrating storage.js
- `js/dice.js` — pure functions, untouched in this phase

### Established Patterns
- Backend: POST to `/api/sessions/{book}/actions` for logged actions (keep this pattern)
- Frontend: ES module imports, no bundler
- Error handling: `try/catch` with console.error fallback (see storage.js and mechanics.js)

### Integration Points
- `app.js` → `ui/stats.js`: pass `(container, state, callbacks)` after extraction
- `storage.js` → `/api/sessions`: GET list on load, PUT upsert on save, include `mechanics: {}`
- `books.js` (or new file) → `js/config/mechanics/registry.js`: dynamic import for book configs

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches on implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-28*
