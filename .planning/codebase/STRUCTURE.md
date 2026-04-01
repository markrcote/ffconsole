# STRUCTURE
_Last updated: 2026-04-01_

## Summary
The repo has a clean two-layer split: `backend/` for Python/FastAPI and `js/` for vanilla ES modules. Static assets (`css/`, `index.html`) sit at the repo root, served directly by FastAPI's `StaticFiles` mount. Planning artifacts live in `.planning/`.

## Directory Layout

```
ffconsole/
├── index.html                    # Single-page app entry point
├── css/
│   └── style.css                 # All styles (no preprocessor)
├── js/
│   ├── app.js                    # Main app: state, events, top-level render
│   ├── dice.js                   # Dice RNG utilities
│   ├── storage.js                # Persistence (REST + localStorage)
│   ├── mechanics.js              # Game rules + action logging
│   ├── books.js                  # FF book catalog (static data)
│   ├── ui/
│   │   ├── stats.js              # Stat row rendering + +/- button binding
│   │   ├── battle.js             # Battle system panel UI
│   │   ├── charCreate.js         # Character creation flow
│   │   └── diceRoller.js         # Standalone dice widget
│   └── config/
│       └── mechanics/
│           ├── registry.js       # Lazy import map for book configs (stub)
│           └── default.js        # Base config shape
├── backend/
│   ├── main.py                   # FastAPI app factory
│   ├── database.py               # SQLite engine + session factory
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── schemas.py                # Pydantic schemas
│   └── routers/
│       ├── sessions.py           # /api/sessions CRUD
│       └── actions.py            # /api/sessions/{book}/actions + logs
├── tests/
│   ├── conftest.py               # pytest fixtures (in-memory SQLite DB)
│   ├── test_sessions.py          # Session CRUD integration tests
│   └── test_actions.py           # Action log integration tests
├── data/
│   └── .gitkeep                  # Reserved for future book data files
├── .planning/                    # GSD planning artifacts (gitignored content)
│   ├── codebase/                 # Codebase map documents
│   └── ...
├── .github/
│   └── workflows/
│       └── test.yml              # GitHub Actions CI
├── requirements.txt              # Prod deps (4 pinned packages)
├── requirements-dev.txt          # Dev deps (adds pytest + httpx)
├── CLAUDE.md                     # Claude Code instructions
└── README.md                     # Project readme
```

## Naming Conventions

**Python:**
- Modules: `snake_case.py`
- Classes: `PascalCase` (`Session`, `ActionLog`, `SessionCreate`)
- Functions/variables: `snake_case`
- Router helper: `_get_session_or_404` (underscore prefix for internal helpers)
- Private helpers: `_now()` defined locally in routers (duplicated across files)

**JavaScript:**
- Files: `camelCase.js` (e.g. `charCreate.js`, `diceRoller.js`)
- Functions: `camelCase` (`renderStats`, `bindStatEvents`, `testLuck`)
- Private/internal functions: `_camelCase` prefix (e.g. `_applyNewCharacter`, `_now`)
- Constants: `UPPER_SNAKE_CASE` (`STORAGE_KEY`, `CONFIG_REGISTRY`, `BOOKS`)
- ES module exports: named exports only (no default exports in app code)

**API:**
- Endpoints: `snake_case` path segments (`/api/sessions`, `/book_number`)
- JSON fields: `snake_case` (`book_number`, `skill_initial`, `action_type`)

## File Organization Patterns

- UI submodules in `js/ui/` receive state and callbacks as arguments — no direct imports of app-level state (prevents circular imports)
- Config modules in `js/config/mechanics/` are isolated from app logic; `registry.js` uses lazy thunks so book configs are only loaded when needed
- Backend routers are thin — business logic (stat mutations) lives in `actions.py`, not in models
- Tests mirror router structure: `test_sessions.py` ↔ `routers/sessions.py`, `test_actions.py` ↔ `routers/actions.py`

## Gaps & Unknowns

- `data/` directory exists with only `.gitkeep` — intended for book-specific data files (Phase 4), currently empty
- No dedicated `constants.js` or shared config file; constants are defined per-module
