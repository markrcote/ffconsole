# Phase 1: Foundation - Research

**Researched:** 2026-03-28
**Domain:** FastAPI/SQLAlchemy schema extension, vanilla JS ES module refactoring, dynamic import config registry
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Recreate the database — drop and recreate `ff.db`. Existing game saves are not worth preserving. No ALTER TABLE or migration needed.
**D-02:** No Alembic or migration tooling needed. A clean schema creation on startup is sufficient.
**D-03:** Migrate `storage.js` from the legacy `/api/state` compat shim to `/api/sessions/{book}` — the proper sessions API that can carry `mechanics_json`.
**D-04:** Delete the compat layer entirely — remove `backend/routers/compat.py` and unregister it from `main.py`. Clean break, no dead code.
**D-05:** The compat shim's `LegacyStateBlob`, `LegacyGameEntry`, `LegacyStatBlock` Pydantic schemas in `schemas.py` should also be removed when compat.py is deleted.
**D-06:** `storage.js` should be updated to call `GET /api/sessions` (list all), `PUT /api/sessions/{book}` (upsert), and include `mechanics: {}` in the payload shape.
**D-07:** Add `mechanics_json` as a TEXT column (nullable, default `'{}'`) to the `Session` ORM model.
**D-08:** Update `SessionCreate`, `SessionUpdate`, and `SessionResponse` Pydantic schemas to include a `mechanics: dict` field. Default `{}`.
**D-09:** Verify `routers/sessions.py` already has PUT upsert before touching `storage.js`.
**D-10:** Create `js/config/mechanics/` directory with `default.js`, `registry.js`, and schema comment block.
**D-11:** Add `getBookConfig(bookNumber)` to `books.js` (or a new `config.js`) using dynamic import via the registry. Falls back to default config for unknown books.
**D-12:** Config schema: `{ bookNumber, extraStats, resources, combatVariant, combatModifiers }`.
**D-13:** No actual book data files in Phase 1 — just schema, default, and registry wiring.
**D-14:** Extract `ui/stats.js` — stat row rendering and +/- button event binding. `app.js` calls `renderStats(container, state, callbacks)`.
**D-15:** Create empty shells for `ui/charCreate.js`, `ui/battle.js`, and `ui/diceRoller.js` (export stubs only).
**D-16:** Do NOT refactor book modal, init flow, or remaining event binding in Phase 1.
**D-17:** No circular imports. `ui/*.js` accept state/callback arguments; they do not import `app.js`.
**D-18:** Add `touch-action: manipulation` to all interactive buttons in `css/style.css`. Apply broadly so all future buttons inherit it.

### Claude's Discretion

- How to wire the sessions API in `storage.js` (exact fetch calls, error handling shape) — follow existing patterns in `storage.js` and `mechanics.js`.
- Whether to add a `name` field to the Session model for character name — needed by Phase 2; may include here if it is a natural fit with the schema work, or defer to Phase 2.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Backend Session model stores book-specific mechanic state in a `mechanics_json` field so extra stats are not lost on save/load | D-07, D-08: add TEXT column + Pydantic `mechanics: dict` field; recreate DB (D-01) |
| INFRA-02 | Config system (`js/config/mechanics/`) with a shared schema and `getBookConfig(bookNumber)` loader using dynamic import | D-10, D-11, D-12, D-13: registry.js + default.js + getBookConfig() |
| INFRA-03 | `app.js` is refactored into focused modules (`ui/stats.js`, `ui/charCreate.js`, `ui/battle.js`, `ui/diceRoller.js`) with no circular dependencies | D-14, D-15, D-17: extract stats.js fully; create stubs for the rest |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure refactor — no new user-visible features. Three parallel workstreams must all complete before Phase 2 can build on them:

**Workstream A (Backend schema):** Add `mechanics_json TEXT` to the Session ORM model, update the three Pydantic schemas (`SessionCreate`, `SessionUpdate`, `SessionResponse`) to carry a `mechanics: dict` field, drop and recreate `ff.db` (decision D-01: clean slate, no migration), and delete the legacy `/api/state` compat layer entirely (`compat.py`, its router registration in `main.py`, and the three Legacy* Pydantic classes in `schemas.py`).

**Workstream B (Frontend storage migration):** Rewrite `storage.js` to call the proper `/api/sessions` API instead of the deleted `/api/state` compat endpoint. Load uses `GET /api/sessions` (list) and derives `currentBook` from `updated_at` ordering. Save uses `PUT /api/sessions/{book}` (upsert) and must include a `mechanics: {}` field in the payload shape. Also create the `js/config/mechanics/` registry (schema comment + `default.js` + `registry.js` + `getBookConfig()` in `books.js`) — no book data files yet.

**Workstream C (app.js split):** Extract `ui/stats.js` from `app.js` (stat row rendering + +/- button binding), create empty stubs for `ui/charCreate.js`, `ui/battle.js`, `ui/diceRoller.js`, and add `touch-action: manipulation` to all interactive button classes in `css/style.css`. No UI change is visible to the user; this only restructures the JS module graph.

**Primary recommendation:** Execute Workstream A first (backend schema + db recreate + compat deletion), verify `PUT /api/sessions/{book}` upsert works end-to-end, then migrate `storage.js` (Workstream B), then do the JS split (Workstream C). The workstreams can otherwise proceed independently within a single plan.

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | 0.115.0 | REST API, router registration | Already in requirements.txt |
| SQLAlchemy | 2.0.35 | ORM Session model, `Column(Text)` for mechanics_json | Already in requirements.txt |
| Pydantic | 2.9.2 | Request/response schema validation, `mechanics: dict = Field(default_factory=dict)` | Already in requirements.txt |
| Vanilla JS ES modules | ES2022+ (native) | Dynamic import for config registry | Already the project convention |

### No New Dependencies

This phase requires zero new packages. All changes use the existing stack.

---

## Architecture Patterns

### Recommended Project Structure After Phase 1

```
js/
  app.js              -- orchestrator (slimmed: delegates stat rendering)
  dice.js             -- pure functions, untouched
  storage.js          -- migrated to /api/sessions
  mechanics.js        -- untouched
  books.js            -- extended: getBookConfig() added
  ui/
    stats.js          -- extracted: stat row render + event binding
    charCreate.js     -- stub (empty export)
    battle.js         -- stub (empty export)
    diceRoller.js     -- stub (empty export)
  config/
    mechanics/
      default.js      -- base config object
      registry.js     -- dynamic import map keyed by book number

backend/
  models.py           -- Session gains mechanics_json TEXT column
  schemas.py          -- SessionCreate/Update/Response gain mechanics: dict; Legacy* classes deleted
  routers/
    sessions.py       -- upsert PUT already handles create-or-update (verified)
    compat.py         -- DELETED
    actions.py        -- untouched
  main.py             -- compat router registration removed
```

### Pattern 1: SQLAlchemy TEXT column for JSON blob

**What:** Store `mechanics_json` as a plain `TEXT` column; serialize/deserialize with `json.loads`/`json.dumps` at the schema boundary. Do not use SQLAlchemy `JSON` type — SQLite's JSON type support is version-dependent; TEXT is reliable.

**When to use:** Any time an ORM column must store an open-ended dict without a fixed schema.

```python
# backend/models.py
mechanics_json = Column(Text, nullable=True, default='{}')
```

```python
# backend/schemas.py — SessionResponse model_validator
import json

@model_validator(mode="before")
@classmethod
def assemble_stat_blocks(cls, data: Any) -> Any:
    if hasattr(data, "__tablename__"):
        raw_mechanics = data.mechanics_json or '{}'
        return {
            # ... existing fields ...
            "mechanics": json.loads(raw_mechanics),
        }
    return data
```

```python
# backend/routers/sessions.py — upsert_session
session.mechanics_json = json.dumps(body.mechanics or {})
```

**Key detail:** `SessionCreate` must also accept `mechanics` so the PUT body can carry it:

```python
class SessionCreate(BaseModel):
    book_number: int = Field(..., ge=1)
    skill: StatBlock
    stamina: StatBlock
    luck: StatBlock
    mechanics: dict = Field(default_factory=dict)
```

### Pattern 2: DB recreation on startup (clean slate)

**What:** Drop all tables, then recreate. No migration needed because no saves are worth preserving.

```python
# backend/database.py
def init_db():
    Base.metadata.drop_all(bind=engine)   # ADD this line
    Base.metadata.create_all(bind=engine)
```

**When to use:** Only valid when data loss is explicitly accepted (D-01). Remove this `drop_all` after Phase 1 is complete and real user data exists.

### Pattern 3: storage.js — sessions API wiring

**What:** `load()` fetches the sessions list, picks the most recently `updated_at` session as `currentBook`, and returns a `{ games, currentBook }` blob compatible with how `app.js` uses it. `save()` puts each game session individually via upsert.

**When to use:** After compat shim is deleted.

```javascript
// js/storage.js — new load()
async function load() {
    try {
        const response = await fetch('/api/sessions');
        if (response.ok) {
            const sessions = await response.json();
            if (sessions.length > 0) {
                const games = {};
                sessions.forEach(s => {
                    games[s.book_number] = {
                        skill: s.skill,
                        stamina: s.stamina,
                        luck: s.luck,
                        mechanics: s.mechanics ?? {},
                    };
                });
                // currentBook = most recently updated session
                const current = sessions.reduce((a, b) =>
                    a.updated_at > b.updated_at ? a : b
                );
                const data = { games, currentBook: current.book_number };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                return data;
            }
        }
    } catch (e) {
        console.error('Failed to load from server:', e);
    }
    // localStorage fallback
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return null;
    }
}

// js/storage.js — new save()
// state shape: { games: { [bookNumber]: { skill, stamina, luck, mechanics } }, currentBook }
async function save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }

    if (!state.currentBook || !state.games) return;

    const game = state.games[state.currentBook];
    if (!game) return;

    try {
        const response = await fetch(`/api/sessions/${state.currentBook}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book_number: state.currentBook,
                skill: game.skill,
                stamina: game.stamina,
                luck: game.luck,
                mechanics: game.mechanics ?? {},
            }),
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (e) {
        console.error('Failed to save to server:', e);
    }
}
```

**Key detail:** The existing `PUT /api/sessions/{book_number}` in `sessions.py` already does create-or-update (verified from source). The only change needed there is to read and write `mechanics_json`.

### Pattern 4: Dynamic import config registry

**What:** Registry maps book number to a lazy import thunk. Only the selected book's config JS is ever downloaded.

```javascript
// js/config/mechanics/registry.js
export const CONFIG_REGISTRY = {
    // Populated in Phase 4 when book data files are created
    // 17: () => import('./book-17.js'),
    // 30: () => import('./book-30.js'),
};
```

```javascript
// js/config/mechanics/default.js
/**
 * Base config shape — used for all books without a specific config.
 *
 * Schema:
 * {
 *   bookNumber: number | null,
 *   extraStats: Array<{ id: string, label: string, initial: number, min: number, max: number | null }>,
 *   resources: Array<{ id: string, label: string, initial: number, min: number, max: number | null, step: number }>,
 *   combatVariant: 'standard',
 *   combatModifiers: {},
 * }
 */
export const config = {
    bookNumber: null,
    extraStats: [],
    resources: [],
    combatVariant: 'standard',
    combatModifiers: {},
};
```

```javascript
// Addition to js/books.js
import { CONFIG_REGISTRY } from './config/mechanics/registry.js';

export async function getBookConfig(bookNumber) {
    const loader = CONFIG_REGISTRY[bookNumber];
    if (!loader) {
        const { config } = await import('./config/mechanics/default.js');
        return config;
    }
    const { config } = await loader();
    return config;
}
```

### Pattern 5: ui/stats.js extraction

**What:** Move `renderStat(name)`, the hold-press timer logic, and `['skill','stamina','luck'].forEach(...)` event binding from `app.js` into `ui/stats.js`. Accept `(container, state, callbacks)` so the module has no dependency on `app.js`.

```javascript
// js/ui/stats.js
/**
 * Render stat rows and bind +/- events.
 * @param {HTMLElement} container - Parent element containing stat controls
 * @param {Object} state - { skill, stamina, luck } each with { initial, current }
 * @param {{ onModify: (name, delta, allowBonus) => void }} callbacks
 */
export function renderStats(container, state, callbacks) { /* ... */ }

export function renderStat(name, state) { /* ... */ }
```

```javascript
// js/ui/charCreate.js  — stub
export function showCharCreate(onComplete) { /* Phase 2 */ }
```

```javascript
// js/ui/battle.js  — stub
export function renderBattle(container, battleState, playerState) { /* Phase 3 */ }
```

```javascript
// js/ui/diceRoller.js  — stub
export function renderDiceRoller(container) { /* Phase 2 */ }
```

**app.js after extraction:** Imports `{ renderStats }` from `'./ui/stats.js'`. Calls `renderStats(document.getElementById('stats-section'), state, { onModify: modifyStat })` instead of inline rendering. `modifyStat` stays in `app.js` since it writes to server.

### Pattern 6: touch-action: manipulation (mobile double-tap fix)

**What:** CSS property that tells the browser no pan/zoom handling is needed on a button, so it eliminates the 300ms click delay without any JS changes.

```css
/* css/style.css — add to all interactive button selectors */
button,
.stat-btn,
.mechanic-btn,
.action-btn,
.modal-cancel {
    touch-action: manipulation;
}
```

Apply once broadly rather than per-button so every future button inherits it automatically.

### Anti-Patterns to Avoid

- **ALTER TABLE / Alembic for this phase:** D-01 explicitly says drop and recreate. Do not introduce migration tooling.
- **Keeping compat.py alive as dead code:** D-04 says delete it entirely. Remove from `main.py` import and router registration too.
- **Importing `app.js` from `ui/*.js`:** Circular dependency. `ui/*.js` receive state and callbacks as arguments.
- **One giant configs.js:** All book configs in one file means startup cost grows with every book added. Dynamic import per-book is the established architecture.
- **Saving all games on every save call:** The new `save()` only upserts `currentBook`. Saving all books on every change would multiply API calls. Match the existing single-book-at-a-time pattern seen in `mechanics.js`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON serialization for mechanics_json | Custom codec, TypeDecorator | `json.dumps` / `json.loads` at schema boundary | SQLAlchemy's `JSON` column type has SQLite caveats; plain TEXT + manual serialization is simpler and version-safe |
| DB schema migration | Alembic, custom ALTER TABLE | `drop_all()` + `create_all()` | D-01 decision; data loss acceptable; no migration needed |
| Dynamic module loading | Custom script tag injection | Native `import()` dynamic import | ES2020, supported in all modern browsers, already used by the project |
| HTTP upsert logic | "try GET, then POST or PUT" two-step | `PUT /api/sessions/{book}` (already implemented as upsert) | Sessions router already has create-or-update in `upsert_session()` — verified |

---

## Common Pitfalls

### Pitfall 1: Pydantic silently strips `mechanics` field (CRITICAL — from PITFALLS.md Pitfall 3)

**What goes wrong:** If `SessionCreate` does not declare a `mechanics` field, Pydantic strips it from the incoming PUT body silently. The column is never written. Book-specific stats reset to `{}` on every reload.

**Why it happens:** Pydantic v2 ignores extra fields by default (model_config default is `extra='ignore'`).

**How to avoid:** `mechanics: dict = Field(default_factory=dict)` must be in `SessionCreate` (for PUT upsert), `SessionUpdate` (for PATCH), and `SessionResponse` (for GET responses). Add it to all three schemas in the same commit.

**Warning signs:** Book-specific stats always come back as `{}` after a page reload even though they were saved.

### Pitfall 2: `drop_all()` left in production code

**What goes wrong:** If `init_db()` retains `Base.metadata.drop_all(bind=engine)` after Phase 1, every server restart wipes all user data in future phases.

**Why it happens:** Convenient for clean schema development, destructive in production.

**How to avoid:** The plan should include a task specifically to remove `drop_all()` before Phase 1 is considered done — or use a one-shot guard (env variable, file sentinel) so it only fires once. Since data is empty at phase start anyway, simplest approach is: add `drop_all`, complete the phase, remove `drop_all` in the same or next commit.

**Warning signs:** Database is empty after every server restart.

### Pitfall 3: app.js state shape incompatibility after storage.js migration

**What goes wrong:** `app.js` calls `load()` and expects `{ games: { [bookNumber]: { skill, stamina, luck } }, currentBook }`. The new `load()` returns the same shape, but if `mechanics` is added to the game entry, `modifyStat` and `selectBook` in `app.js` may overwrite `state` with objects that lack `mechanics`, then save them and lose the field.

**Why it happens:** `app.js` constructs new state objects inline (e.g., `state = { skill: ..., stamina: ..., luck: ... }` on new game creation) and assigns them to `games[bookNumber]`. These constructed objects have no `mechanics` key.

**How to avoid:** Every place `app.js` constructs a new game state object must include `mechanics: {}`. Search for `games[bookNumber] =` assignments and `state = {` constructions in `app.js` — there are three such sites in the current code.

**Warning signs:** `mechanics` field disappears from a session after creating a new game.

### Pitfall 4: Mobile double-tap on combat buttons (from PITFALLS.md Pitfall 4)

**What goes wrong:** Combat buttons without `touch-action: manipulation` synthesize a delayed second click on mobile, firing two rounds per tap.

**Why it happens:** Browser applies a 300ms tap delay waiting to distinguish tap from double-tap or pinch-zoom.

**How to avoid:** D-18 — add `touch-action: manipulation` to all interactive button selectors in `css/style.css` in this phase, so it is present before Phase 3 adds combat buttons.

**Warning signs:** Two combat rounds resolve per tap on a phone.

### Pitfall 5: Circular import if getBookConfig imports from app.js

**What goes wrong:** If `registry.js` or `getBookConfig()` ever imports from `app.js`, the ES module loader will throw a circular dependency error (or silently provide undefined values).

**Why it happens:** Lazy import functions can still form circular dependency chains if the imported module itself imports the importer.

**How to avoid:** D-17 rule — `ui/*.js` and `config/*.js` accept data as arguments or import only from `dice.js`, `books.js`, `mechanics.js`. Never import `app.js` anywhere except the top-level HTML script tag.

### Pitfall 6: compat.py import left in main.py after file deletion

**What goes wrong:** Python raises `ModuleNotFoundError` at startup if `backend/main.py` still has `from .routers import ... compat ...` after `compat.py` is deleted.

**Why it happens:** Two edits are required for full deletion: (1) delete the file, (2) remove its import and `include_router` call.

**How to avoid:** Treat `compat.py` deletion as a two-part task: delete the file AND edit `main.py` in the same step.

---

## Code Examples

All examples are derived from direct codebase analysis (HIGH confidence).

### Verified: PUT /api/sessions/{book_number} — existing upsert (sessions.py lines 52-76)

The endpoint already does create-or-update. After adding `mechanics_json`, it only needs two lines added:

```python
# In upsert_session():
session.mechanics_json = json.dumps(body.mechanics or {})
```

(Both in the `if session:` branch and the `else:` branch — when constructing the new Session.)

### Verified: SessionResponse model_validator shape (schemas.py lines 21-35)

Extend the existing `assemble_stat_blocks` to decode `mechanics_json`:

```python
@model_validator(mode="before")
@classmethod
def assemble_stat_blocks(cls, data: Any) -> Any:
    if hasattr(data, "__tablename__"):
        import json
        return {
            "id": data.id,
            "book_number": data.book_number,
            "created_at": data.created_at,
            "updated_at": data.updated_at,
            "skill": {"initial": data.skill_initial, "current": data.skill_current},
            "stamina": {"initial": data.stamina_initial, "current": data.stamina_current},
            "luck": {"initial": data.luck_initial, "current": data.luck_current},
            "mechanics": json.loads(data.mechanics_json or '{}'),
        }
    return data
```

### Verified: main.py router registrations (main.py lines 9, 29-31)

After compat deletion, `main.py` changes are:

```python
# Remove from import:
from .routers import sessions, compat, actions
# Change to:
from .routers import sessions, actions

# Remove line:
app.include_router(compat.router, prefix="/api", tags=["compat"])
```

### Verified: ActionLog's `post_action` in actions.py still uses `SessionResponse.model_validate(session)`

The `actions.py` router returns `ActionResult(session=SessionResponse.model_validate(session), ...)`. After adding `mechanics` to `SessionResponse`, every action response will automatically include the current mechanics dict. No changes needed in `actions.py`.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `/api/state` legacy blob (compat.py) | `/api/sessions/{book}` per-session upsert | Clean break; enables mechanics_json per session |
| Flat stat columns only in Session | Flat columns + `mechanics_json TEXT` | Open-ended book-specific data without schema changes |
| All logic in app.js | Orchestrator pattern: app.js + `ui/stats.js` | Sets module boundary for Phase 2/3 additions |

---

## Open Questions

1. **Should `name` (character name) be added to Session model in this phase?**
   - What we know: Phase 2 (character creation) needs it. The schema work happens now. Adding it here costs ~3 lines; deferring means another schema recreate.
   - What's unclear: User explicitly marked this as Claude's discretion.
   - Recommendation: Add `name = Column(Text, nullable=True)` now. Pydantic schemas get `name: str | None = None`. No regression since it is nullable. Avoids a second DB recreate in Phase 2.

2. **Should `save()` in storage.js save all sessions or only `currentBook`?**
   - What we know: The existing compat shim saves the full `games` dict on every save. But `mechanics.js` pattern shows single-session saves via `POST /api/sessions/{book}/actions`.
   - What's unclear: Whether app.js ever needs to save a non-current session.
   - Recommendation: Save only `currentBook` on each call. Matches the `mechanics.js` single-session pattern. All sessions are loaded on `load()` from the list endpoint, so no data loss risk.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.13 | FastAPI/SQLAlchemy | Available | 3.13 (venv present) | — |
| uvicorn | Dev server | Available | 0.30.6 (requirements.txt) | — |
| SQLite | ff.db | Available | Built into Python | — |
| Node.js | package.json / legacy server.js | Available | v24.14.0 | — (not needed for this phase) |
| ff.db | Current DB state | Exists | — | Will be dropped + recreated |

No missing dependencies. All tooling is present.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 1 |
|-----------|-------------------|
| Vanilla JS only (no frontend framework) | Config registry and ui/stats.js must use plain ES modules |
| No build step — native ES modules | Dynamic import (`import()`) is the correct mechanism; no bundler syntax |
| Mobile-first | `touch-action: manipulation` (D-18) is required, not optional |
| Python 3.13, FastAPI 0.115.0, SQLAlchemy 2.0.35, Pydantic 2.9.2 | All existing; no version upgrades |
| State persists to backend | localStorage remains a fallback cache only; server is source of truth |
| GSD Workflow Enforcement | All edits must go through GSD execute-phase; no direct repo edits outside workflow |

---

## Sources

### Primary (HIGH confidence — direct codebase analysis)

- `backend/models.py` — Session ORM model verified: no `mechanics_json` column currently; `book_number` is unique-indexed
- `backend/schemas.py` — Verified: `LegacyStateBlob`, `LegacyGameEntry`, `LegacyStatBlock` present and must be deleted; `SessionCreate`, `SessionUpdate`, `SessionResponse` all need `mechanics: dict`
- `backend/routers/sessions.py` — Verified: `PUT /api/sessions/{book_number}` (lines 52-76) already implements upsert (create-or-update); ready for mechanics_json extension
- `backend/routers/compat.py` — Verified: full file content; safe to delete after storage.js is migrated
- `backend/routers/actions.py` — Verified: uses `SessionResponse.model_validate(session)`; will auto-include mechanics after schema update; no changes needed
- `backend/main.py` — Verified: compat router import and registration on lines 9 and 30; both must be removed
- `backend/database.py` — Verified: `init_db()` only calls `create_all`; `drop_all` must be added and later removed
- `js/app.js` — Verified: three sites where game state is constructed without `mechanics` key (lines 131-136, 149-154, three calls to `save({ games, currentBook })`)
- `js/storage.js` — Verified: currently calls `/api/state` PUT and GET; needs full rewrite
- `js/mechanics.js` — Verified: pattern for fetch calls with try/catch and null returns; use as style guide for storage.js rewrite
- `js/books.js` — Verified: currently exports `BOOKS, getBook, searchBooks`; `getBookConfig` addition goes here
- `css/style.css` — Verified: no `touch-action` rules present; button classes are `.stat-btn`, `.mechanic-btn`, `.action-btn`, `.modal-cancel`
- `.planning/research/PITFALLS.md` — Pitfall 3 (Pydantic strips fields), Pitfall 4 (mobile double-tap): HIGH confidence, direct codebase analysis
- `.planning/research/ARCHITECTURE.md` — Module map, config registry pattern, stats extraction: HIGH confidence

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all library versions from requirements.txt
- Architecture: HIGH — all patterns derived from existing codebase analysis; no external research needed
- Pitfalls: HIGH — Pitfalls 1 and 4 from PITFALLS.md (codebase analysis); Pitfalls 2, 3, 5, 6 are direct code inspection findings

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable stack, 30-day estimate)
