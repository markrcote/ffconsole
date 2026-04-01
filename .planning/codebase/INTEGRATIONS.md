# INTEGRATIONS
_Last updated: 2026-04-01_

## Summary
FF Console has no external third-party service integrations. All integrations are internal: the JS frontend talks to the FastAPI backend REST API, which reads/writes a local SQLite file. The browser's `localStorage` serves as an offline cache and fallback.

## Internal REST API

The frontend (`js/storage.js`, `js/mechanics.js`) communicates with the backend via `fetch()` to these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/sessions` | GET | Load all sessions on startup |
| `PUT /api/sessions/{book}` | PUT | Upsert (save) current book session |
| `GET /api/sessions/{book}` | GET | Fetch single session |
| `POST /api/sessions/{book}/actions` | POST | Log a game action + apply server-side stat mutation |
| `GET /api/sessions/{book}/logs` | GET | Fetch action log history for battle rendering |
| `POST /api/sessions` | POST | Create new session (used by charCreate flow) |
| `PATCH /api/sessions/{book}` | PATCH | Partial update |
| `DELETE /api/sessions/{book}` | DELETE | Delete session |

All API routes are under `/api/`. FastAPI's `StaticFiles` catch-all serves everything else (HTML, JS, CSS).

## Browser Storage

- **localStorage key:** `ffconsole_gamestate`
- **Purpose:** Full state cache for offline/server-unreachable scenarios
- **Write:** On every `save()` call in `js/storage.js`
- **Read:** Fallback in `load()` when `GET /api/sessions` fails or returns empty

## Database

- **Engine:** SQLite via SQLAlchemy 2.0
- **File:** `backend/ff.db` (gitignored, lives alongside the backend package)
- **Schema:** Two tables — `sessions` (one row per book number) and `action_logs` (append-only event log, FK to sessions with CASCADE delete)
- **Init:** `create_all()` on startup via `init_db()` in `backend/database.py` — additive only, no migrations

## CORS

- `allow_origins=["*"]` — open to any origin
- `allow_methods=["*"]`, `allow_headers=["*"]`
- Configured in `backend/main.py` via `CORSMiddleware`

## CI

- **GitHub Actions** at `.github/workflows/test.yml` — runs pytest on push/PR
- No deployment pipeline in the repo

## External Services

None. No analytics, no auth provider, no CDN, no external API calls.

## Gaps & Unknowns

- No webhook or WebSocket integration; real-time sync between tabs is not supported
- No documented strategy if `ff.db` needs to be backed up or migrated to a remote DB
