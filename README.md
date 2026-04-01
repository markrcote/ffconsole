# Fighting Fantasy Console

A web app for tracking character stats (Skill, Stamina, Luck) during [Fighting Fantasy](https://www.fightingfantasy.com/) gamebook adventures.

## Features

- Track Skill, Stamina, and Luck with initial and current values
- Long-press `+` to allow bonus increases above initial value
- Supports up to 67 Fighting Fantasy books simultaneously
- State persists to SQLite via FastAPI backend (falls back to localStorage)

## Running

### FastAPI backend (recommended)

```bash
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 3000 --reload
```

Open http://localhost:3000

### Static only (no persistence)

```bash
python3 -m http.server 8000
```

### Production (Debian)

Install system dependencies:

```bash
sudo apt install python3 python3-venv python3-pip
```

Clone the repo and set up the virtualenv:

```bash
git clone <repo-url> /opt/ffconsole
cd /opt/ffconsole
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

Create a systemd service at `/etc/systemd/system/ffconsole.service`:

```ini
[Unit]
Description=FF Console
After=network.target

[Service]
WorkingDirectory=/opt/ffconsole
ExecStart=/opt/ffconsole/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 3000
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ffconsole
```

To expose it publicly, proxy with nginx:

```nginx
server {
    listen 80;
    server_name your.domain;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

The database is stored at `/opt/ffconsole/backend/ff.db`. Back it up before upgrades.

To upgrade:

```bash
cd /opt/ffconsole
git pull
venv/bin/pip install -r requirements.txt
sudo systemctl restart ffconsole
```

## API

Base URL: `http://localhost:3000/api`

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sessions` | List all game sessions |
| `POST` | `/sessions` | Create a session |
| `GET` | `/sessions/{book_number}` | Get a session |
| `PUT` | `/sessions/{book_number}` | Upsert a session |
| `PATCH` | `/sessions/{book_number}` | Update stats partially |
| `DELETE` | `/sessions/{book_number}` | Delete a session |

Interactive docs: http://localhost:3000/api/docs (when server is running — note: blocked by the StaticFiles catch-all; use `/docs` directly via uvicorn on a different port if needed)

## Architecture

```
index.html          — entry point
js/
  app.js            — state management, DOM rendering, event binding
  dice.js           — dice rolling (skill: 1d6+6, stamina: 2d6+12, luck: 1d6+6)
  storage.js        — persistence (server API → localStorage fallback)
  books.js          — Fighting Fantasy book catalogue (67 books)
css/style.css       — medieval parchment theme
backend/
  main.py           — FastAPI app, CORS, static file serving
  database.py       — SQLite engine and session factory
  models.py         — SQLAlchemy ORM model
  schemas.py        — Pydantic request/response models
  routers/
    sessions.py     — /api/sessions CRUD
```

State is stored in `backend/ff.db` (SQLite, gitignored). One row per book number.
