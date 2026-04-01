# STACK
_Last updated: 2026-04-01_

## Summary
FF Console is a vanilla JS single-page app served by a FastAPI/Python 3.13 backend with SQLite persistence. There is no build step — all JS is served as native ES modules from disk, and all Python dependencies are pinned in `requirements.txt`.

## Backend

| Component | Version | Purpose |
|-----------|---------|---------|
| Python | 3.13 | Runtime (venv at `venv/lib/python3.13/`) |
| FastAPI | 0.115.0 | ASGI web framework (`backend/main.py`) |
| Uvicorn[standard] | 0.30.6 | ASGI server; run with `--reload` in dev |
| SQLAlchemy | 2.0.35 | ORM + SQLite engine (`backend/database.py`) |
| Pydantic | 2.9.2 | Request/response schema validation (`backend/schemas.py`) |
| SQLite | (stdlib) | Single-file DB at `backend/ff.db` (gitignored) |

Production dependencies: `requirements.txt` (4 packages, all pinned).
Dev dependencies: `requirements-dev.txt` adds `pytest==8.3.3` and `httpx==0.27.2`.

## Frontend

| Component | Version | Purpose |
|-----------|---------|---------|
| JavaScript | ES2022+ | All app logic; native ES modules (`type="module"`) |
| HTML5 | — | Single-page UI (`index.html`) |
| CSS3 | — | Styles (`css/style.css`) |
| Browser fetch API | (native) | HTTP calls to backend |
| localStorage | (native) | Client-side state cache / offline fallback |

No third-party JS libraries. No bundler, transpiler, or build step.

## Dev Tooling

- **pytest** — backend integration tests (`tests/`)
- **httpx** — async HTTP client for test fixtures
- **GitHub Actions** — CI workflow at `.github/workflows/test.yml`
- No JS test runner, no linter config, no type checker

## Runtime Environment

- Python 3.13 in virtualenv (`venv/`)
- Uvicorn serves on port 3000 by default
- FastAPI mounts static files at `/` (catch-all, registered last so API routes take priority)
- Modern evergreen browsers required (native ES module support)

## Package Management

- `pip` with flat `requirements.txt` (pinned exact versions, no lockfile)
- No npm / package.json — frontend has zero JS dependencies

## Key Source Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app factory, middleware, router registration |
| `backend/database.py` | SQLite engine setup, session factory |
| `backend/models.py` | SQLAlchemy ORM models (`Session`, `ActionLog`) |
| `backend/schemas.py` | Pydantic schemas for API |
| `backend/routers/sessions.py` | CRUD for `/api/sessions` |
| `backend/routers/actions.py` | `/api/sessions/{book}/actions` and action logs |
| `js/app.js` | Main frontend application logic |
| `js/dice.js` | Dice rolling utilities |
| `js/storage.js` | Persistence layer (server + localStorage fallback) |
| `js/mechanics.js` | Skill/stamina/luck tests, combat rounds |
| `js/books.js` | Fighting Fantasy book catalog and search |
| `js/ui/stats.js` | Stat row rendering and +/- button event binding |
| `js/ui/battle.js` | Battle system panel UI |
| `js/ui/charCreate.js` | Character creation flow UI |
| `js/ui/diceRoller.js` | Standalone dice roller widget |
| `js/config/mechanics/registry.js` | Book-specific mechanic config registry (lazy imports, stub) |
| `js/config/mechanics/default.js` | Default mechanic config shape |

## Gaps & Unknowns

- No pinned Python version via pyproject.toml; 3.13 inferred from venv path
- No production process manager documented (gunicorn, systemd, etc.)
