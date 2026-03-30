# Tech Stack

**Analysis Date:** 2026-03-28

## Languages

- **Python 3.13** - Backend server, API, ORM models
- **JavaScript (ES2022+)** - Frontend application, uses ES modules (`type="module"`)
- **HTML5** - Single-page UI (`index.html`)
- **CSS3** - Styles (`css/style.css`)

## Frameworks & Libraries

**Backend (Python):**
- `fastapi==0.115.0` - ASGI web framework for REST API (`backend/main.py`)
- `uvicorn[standard]==0.30.6` - ASGI server, runs with `--reload` in dev
- `sqlalchemy==2.0.35` - ORM and database engine (`backend/database.py`, `backend/models.py`)
- `pydantic==2.9.2` - Request/response schema validation (`backend/schemas.py`)

**Frontend (JavaScript):**
- No third-party JS libraries — vanilla JS only
- Browser `fetch` API for HTTP calls
- `localStorage` for client-side state cache

## Build Tools

- None. No bundler, transpiler, or build step.
- Frontend is served as-is (static files) via FastAPI's `StaticFiles` mount.
- `index.html` loads `js/app.js` directly as a native ES module.

## Runtime Environment

**Backend:**
- Python 3.13 (confirmed in venv at `venv/lib/python3.13/`)
- Uvicorn ASGI server on port 3000

**Frontend:**
- Modern evergreen browsers supporting ES modules natively
- No polyfills or transpilation

## Package Management

**Python:**
- `pip` with `requirements.txt` (pinned versions)
- Virtualenv at `venv/` (committed `.gitignore` excludes only `backend/ff.db` and `__pycache__`)
- Lockfile: none (flat `requirements.txt` with exact versions)

## Key Source Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app factory, middleware, router registration |
| `backend/database.py` | SQLite engine setup, session factory |
| `backend/models.py` | SQLAlchemy ORM models (`Session`, `ActionLog`) |
| `backend/schemas.py` | Pydantic schemas for API and legacy compat |
| `backend/routers/sessions.py` | CRUD for `/api/sessions` |
| `backend/routers/compat.py` | Legacy `/api/state` GET/PUT shim |
| `backend/routers/actions.py` | `/api/sessions/{book}/actions` and logs |
| `js/app.js` | Main frontend application logic |
| `js/dice.js` | Dice rolling utilities |
| `js/storage.js` | Persistence layer (server + localStorage fallback) |
| `js/mechanics.js` | Skill/stamina/luck tests, combat rounds |
| `js/books.js` | Fighting Fantasy book catalog and search |

---

*Stack analysis: 2026-03-28*
