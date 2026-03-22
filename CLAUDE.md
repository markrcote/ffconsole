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
