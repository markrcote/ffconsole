# CONCERNS
_Last updated: 2026-04-01_

## Summary
The codebase is a single-player, server-backed web app with no authentication. The most pressing issues are a stored XSS vulnerability in battle history rendering and the complete absence of database migrations. Most other concerns are low-risk given the intended single-player local deployment, but would need addressing before any public hosting.

## Technical Debt

- **No database migrations** (`backend/database.py`) — `init_db()` uses SQLAlchemy `create_all()`, which is additive-only. Any schema change silently breaks existing `ff.db` files. No Alembic or migration tooling in place.
- **Dual dice roll in luck test** (`js/app.js` lines 382–385) — cosmetic dice are rolled locally, then separate dice are rolled inside `testLuck()` in `js/mechanics.js`. The displayed result never matches the actual result used for the test outcome.
- **`testSkill` and `testStamina` exported but unconnected** (`js/mechanics.js` lines 23–38) — both functions exist and are exported, but no UI buttons trigger them.
- **`clear()` only clears localStorage** (`js/storage.js`) — if ever called, it would silently fail to reset server-side state, leaving the backend out of sync.
- **`name` cannot be nulled via PATCH** (`backend/routers/sessions.py` line 100) — `if body.name is not None` guard means `PATCH {"name": null}` is silently ignored with no error.
- **`updated_at` sorted as string** (`js/storage.js` line 70) — uses `>` comparison on ISO date strings; works only if the format stays consistent (no timezone variation, no format drift).
- **Unconstrained `action_type`** (`backend/routers/actions.py`) — accepts any string value; unknown types pass through silently with no enum validation or rejection.

## Known Risks

- **Stored XSS** — Enemy name from `<input>` is stored to the server via action logs, then retrieved and interpolated directly into `innerHTML` in `js/ui/battle.js` (lines 98, 137, 419 — `renderRoundCard`, `renderSummaryHTML`, `renderBattleEntry`). A payload like `<img src=x onerror=alert(1)>` would execute when battle history is rendered. **This is the highest-severity issue.**
- **No authentication** — `allow_origins=["*"]` CORS with no auth layer. Any network-accessible actor can read, overwrite, or delete all sessions by book number. Acceptable for local single-player; high risk if deployed publicly.

## Missing Pieces

- **No frontend tests** — all test coverage is Python-only (backend). Zero test coverage for JS modules.
- **No API authentication / authorization** — REST API is fully open.
- **No input sanitisation on user-supplied strings** — enemy names and other text fields go directly into the DOM via `innerHTML`.
- **No error UI for failed saves** — storage failures (network down, backend 500) are caught silently; user gets no feedback that state wasn't persisted.

## TODO / FIXME in Code

No explicit `TODO`, `FIXME`, or `HACK` comments were found in the codebase.

## Gaps & Unknowns

- It's unclear whether the `compat.py` shim (`/api/state`) is still in active use or can be removed now that `storage.js` targets `/api/sessions/{book}` directly.
- The `js/config/mechanics/registry.js` lazy-load registry is populated in Phase 4 (per CLAUDE.md); it's currently an empty stub with no book-specific configs wired.
- No documented strategy for handling concurrent writes (e.g. same book open in two browser tabs).
