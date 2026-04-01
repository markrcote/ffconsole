# ARCHITECTURE
_Last updated: 2026-04-01_

## Summary
FF Console is a server-backed single-page app. The FastAPI backend owns all persistent state (SQLite) and applies game logic mutations atomically via an action log. The vanilla JS frontend is a thin rendering layer that keeps an in-memory copy of state and syncs to the server on every change.

## High-Level Architecture

```
Browser
  index.html
  └── js/app.js (ES module entry point)
       ├── js/storage.js        ← save/load via REST + localStorage cache
       ├── js/mechanics.js      ← game rules, POSTs actions to backend
       ├── js/dice.js           ← RNG utilities
       ├── js/books.js          ← FF book catalog (static data)
       ├── js/ui/stats.js       ← stat row rendering + +/- buttons
       ├── js/ui/battle.js      ← battle panel UI
       ├── js/ui/charCreate.js  ← character creation flow
       ├── js/ui/diceRoller.js  ← standalone dice widget
       └── js/config/mechanics/
            ├── registry.js     ← lazy import map keyed by book number (stub)
            └── default.js      ← base config shape

FastAPI Server (port 3000)
  backend/main.py
  ├── /api/sessions       → backend/routers/sessions.py (CRUD)
  ├── /api/sessions/{book}/actions  → backend/routers/actions.py
  ├── /api/sessions/{book}/logs     → backend/routers/actions.py
  └── /                  → StaticFiles(repo root) catch-all

SQLite (backend/ff.db)
  ├── sessions       (one row per book_number)
  └── action_logs    (append-only, FK → sessions)
```

## Data Flow

### Startup (load)
1. `app.js init()` calls `storage.js load()`
2. `load()` hits `GET /api/sessions` — returns all sessions
3. `currentBook` is derived from the session with the most recent `updated_at`
4. Full state cached to `localStorage` as backup
5. If server unreachable, falls back to `localStorage`

### Stat change (save)
1. User clicks +/- button → `app.js modifyStat()`
2. Updates in-memory `state` object
3. Calls `storage.js save({ games, currentBook })`
4. `save()` PUTs `currentBook` session to `/api/sessions/{book}` AND writes full state to `localStorage`

### Action (luck test, combat)
1. User triggers action in UI → `app.js` event handler
2. Calls function in `mechanics.js` (e.g. `testLuck()`)
3. `mechanics.js` rolls dice locally, POSTs to `/api/sessions/{book}/actions`
4. Backend applies stat mutation atomically (e.g. luck -1) + inserts `ActionLog` row
5. Returns `{ session, log }` — frontend syncs `state` from returned `session`
6. If server unreachable, `mechanics.js` returns `null` for session; `app.js` applies fallback locally

### Character creation
1. `ui/charCreate.js` handles book search + dice roll UI
2. On confirm, calls `app.js _applyNewCharacter(bookNumber, stats, name)`
3. `_applyNewCharacter` POSTs to `/api/sessions` (create) then PUTs via `save()`

## Module Boundaries

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `app.js` | State management, event binding, top-level render | storage, dice, books, mechanics, all ui/* |
| `storage.js` | Persist/load state; server + localStorage | (none — pure fetch + localStorage) |
| `mechanics.js` | Game rules + action logging | dice.js |
| `dice.js` | RNG: `roll(n)`, `rollMultiple(count)`, `rollInitialStats()` | (none) |
| `books.js` | Static book catalog + search | (none) |
| `ui/stats.js` | Render stat rows; bind +/- buttons | (receives state + callbacks as args) |
| `ui/battle.js` | Battle panel, round cards, history fetch | dice.js, mechanics.js |
| `ui/charCreate.js` | Character creation modal | dice.js, books.js, storage.js |
| `ui/diceRoller.js` | Standalone dice widget | dice.js |
| `config/mechanics/registry.js` | Lazy import map for book configs | (stub, empty) |
| `config/mechanics/default.js` | Base config shape | (none) |

## Backend Module Boundaries

| Module | Responsibility |
|--------|---------------|
| `main.py` | App factory, CORS, router registration, static mount |
| `database.py` | SQLite engine, `get_db` session factory, `init_db` |
| `models.py` | ORM: `Session`, `ActionLog` |
| `schemas.py` | Pydantic: `SessionCreate`, `SessionResponse`, `SessionUpdate`, `ActionRequest`, `ActionLogResponse`, `ActionResult` |
| `routers/sessions.py` | Full CRUD for `/api/sessions` |
| `routers/actions.py` | `POST /actions` (atomic action + log), `GET /logs` |

## Key Design Decisions

- **Stat mutations are server-side:** `actions.py` applies luck deduction, stamina damage atomically with the log write. Frontend never writes stats directly for action events — it syncs from the returned `SessionResponse`.
- **`currentBook` derived from `updated_at`:** On load, the most-recently-updated session becomes active. This enables device switching.
- **No build step:** JS is served as-is; no module bundler. All imports use relative paths.
- **localStorage as cache, not source of truth:** When the backend is reachable, its state wins.

## Gaps & Unknowns

- `js/config/mechanics/registry.js` is a stub — book-specific mechanic configs are planned for Phase 4 but not yet implemented
- No WebSocket/SSE; concurrent-tab sync is not handled
