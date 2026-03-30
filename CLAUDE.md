# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Fighting Fantasy Adventure Sheet web app - a static HTML/CSS/JS application for tracking character stats (Skill, Stamina, Luck) during Fighting Fantasy gamebook adventures.

## Development

### FastAPI backend (recommended)

```bash
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 3000 --reload
```

Open http://localhost:3000. State persists to `backend/ff.db` (SQLite, gitignored).

### Static only (no persistence)

```bash
python3 -m http.server 8000
```

## Architecture

**Entry point:** `index.html` loads `js/app.js` as an ES module.

**JavaScript modules (`js/`):**
- `app.js` - Main application: state management, DOM rendering, event binding. Manages the game state object containing skill/stamina/luck with initial and current values.
- `dice.js` - Dice rolling utilities. `rollInitialStats()` generates starting stats per FF rules (skill: 1d6+6, stamina: 2d6+12, luck: 1d6+6).
- `storage.js` - Persistence: POSTs to `/api/state` when backend is available, falls back to localStorage (`ffconsole_gamestate`).

**Backend (`backend/`):**
- `main.py` - FastAPI app with CORS middleware; mounts static files at `/` (catch-all, registered last)
- `database.py` - SQLite engine (`ff.db`) and SQLAlchemy session factory
- `models.py` - SQLAlchemy ORM model; one row per book number with flat stat columns
- `schemas.py` - Pydantic models: `SessionCreate/Response/Update` (REST API) and `LegacyStateBlob/GameEntry/StatBlock` (compat shim)
- `routers/sessions.py` - `/api/sessions` CRUD (GET list, POST, GET by book, PUT upsert, PATCH partial, DELETE)
- `routers/compat.py` - `/api/state` GET/PUT shim that maps the legacy `storage.js` blob format to the ORM

**Key behaviors:**
- Stats cannot go below 0
- Normal +/- buttons keep current value at or below initial
- Long-press (500ms) on + button allows "bonus" increases above initial value
- State auto-saves on every change (to backend if available, else localStorage)
- `currentBook` in the compat blob is determined by most recently updated session (`updated_at`)

<!-- GSD:project-start source:PROJECT.md -->
## Project

**FF Console**

A web-based companion app for Fighting Fantasy gamebooks by Steve Jackson and Ian Livingstone. It handles the mechanics so you can focus on the adventure: character creation, combat, luck tests, dice rolls, and book-specific mechanics for individual titles.

**Core Value:** Complete, accurate mechanical support for playing Fighting Fantasy — the app should never be the bottleneck when you need to resolve a combat, test your luck, or roll some dice.

### Constraints

- **Tech stack**: Vanilla JS only (no frontend framework) — existing codebase constraint
- **No build step**: Files served as-is — keep all JS as native ES modules
- **Mobile-first**: UI must work well on phone screens for use alongside physical books
- **Single-player, server-backed**: All state persists to the backend; player can switch devices and resume any session
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- **Python 3.13** - Backend server, API, ORM models
- **JavaScript (ES2022+)** - Frontend application, uses ES modules (`type="module"`)
- **HTML5** - Single-page UI (`index.html`)
- **CSS3** - Styles (`css/style.css`)
## Frameworks & Libraries
- `fastapi==0.115.0` - ASGI web framework for REST API (`backend/main.py`)
- `uvicorn[standard]==0.30.6` - ASGI server, runs with `--reload` in dev
- `sqlalchemy==2.0.35` - ORM and database engine (`backend/database.py`, `backend/models.py`)
- `pydantic==2.9.2` - Request/response schema validation (`backend/schemas.py`)
- No third-party JS libraries — vanilla JS only
- Browser `fetch` API for HTTP calls
- `localStorage` for client-side state cache
## Build Tools
- None. No bundler, transpiler, or build step.
- Frontend is served as-is (static files) via FastAPI's `StaticFiles` mount.
- `index.html` loads `js/app.js` directly as a native ES module.
## Runtime Environment
- Python 3.13 (confirmed in venv at `venv/lib/python3.13/`)
- Uvicorn ASGI server on port 3000
- Modern evergreen browsers supporting ES modules natively
- No polyfills or transpilation
## Package Management
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
