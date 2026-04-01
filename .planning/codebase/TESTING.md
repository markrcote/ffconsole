# Testing Patterns

_Last updated: 2026-04-01_

## Summary

Testing is backend-only. All 25 tests are Python integration tests exercising the FastAPI REST API via `httpx`/`TestClient`. There are no JavaScript tests — frontend logic (dice rolling, stat mutation, UI rendering) is untested by automated tests. The test suite runs in CI on every push and PR to `main`.

---

## Test Framework

**Runner:** pytest 8.3.3
**Config file:** None (no `pytest.ini`, `pyproject.toml`, or `setup.cfg` — uses defaults)
**HTTP client:** `httpx==0.27.2` (required by FastAPI's `TestClient`)
**Test files:** `tests/test_sessions.py`, `tests/test_actions.py`
**Fixture file:** `tests/conftest.py`

**Run commands:**
```bash
# From repo root, with venv activated:
pytest tests/ -v          # verbose output
pytest tests/ -v -k foo   # run tests matching "foo"
pytest tests/             # terse output (CI default)
```

**CI:** `.github/workflows/test.yml` — runs `pytest tests/ -v` on push/PR to `main` using Python 3.13.

---

## Test File Organization

Tests are in a top-level `tests/` package (has `tests/__init__.py`). Test files are **not** co-located with source files.

```
tests/
├── __init__.py
├── conftest.py          # shared fixture and test data constant
├── test_sessions.py     # /api/sessions CRUD (14 tests)
└── test_actions.py      # /api/sessions/{book}/actions and logs (11 tests)
```

---

## Fixture and Test Data Setup

### `conftest.py` — `client` fixture

All tests share a single `client` fixture that spins up an in-memory SQLite database, overrides FastAPI's `get_db` dependency, and yields a `TestClient`. The override is cleared after each test.

```python
@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

Key points:
- Uses `StaticPool` to ensure all connections in a single test share the same in-memory DB
- Schema is created fresh per test invocation (each test gets an empty DB)
- FastAPI's DI is used cleanly — no monkeypatching of modules

### `SESSION_BODY` shared constant

A module-level constant in `conftest.py` provides a canonical valid session payload, imported by both test files:
```python
SESSION_BODY = {
    "book_number": 1,
    "skill": {"initial": 10, "current": 10},
    "stamina": {"initial": 20, "current": 20},
    "luck": {"initial": 9, "current": 9},
}
```

Variations are created inline with dict spread: `{**SESSION_BODY, "name": "Alaric"}`.

### `session` fixture in `test_actions.py`

A local fixture builds on `client` by pre-creating a session, returning the ready client:
```python
@pytest.fixture
def session(client):
    client.post("/api/sessions", json=SESSION_BODY)
    return client
```

Tests that need an existing session use `session`; tests that need to control initial state use `client` directly.

---

## Test Structure Patterns

### Naming convention

All test functions follow `test_{verb}_{subject}_{condition}`:
- `test_list_sessions_empty`
- `test_create_duplicate_session_returns_409`
- `test_luck_test_does_not_go_below_zero`
- `test_combat_round_stamina_does_not_go_below_zero`
- `test_delete_session_cascades_logs`

### Structure

Each test function is a flat sequence: arrange → act → assert. No `describe`-style nesting. Setup beyond fixture is done inline.

```python
def test_upsert_updates_existing_session(client):
    client.post("/api/sessions", json=SESSION_BODY)           # arrange
    updated = {**SESSION_BODY, "stamina": {"initial": 20, "current": 14}}
    r = client.put("/api/sessions/1", json=updated)           # act
    assert r.status_code == 200                               # assert
    assert r.json()["stamina"]["current"] == 14
```

---

## What Is Tested

### `test_sessions.py` — `/api/sessions` CRUD (14 tests)

| Test | Covers |
|------|--------|
| `test_list_sessions_empty` | GET list returns `[]` |
| `test_create_session` | POST 201, full response body shape |
| `test_create_session_with_name` | POST with optional `name` field |
| `test_create_duplicate_session_returns_409` | POST conflict |
| `test_get_session` | GET by book number |
| `test_get_session_not_found` | GET 404 |
| `test_list_sessions_returns_created` | GET list with multiple items |
| `test_upsert_creates_new_session` | PUT creates when missing |
| `test_upsert_updates_existing_session` | PUT overwrites stat values |
| `test_upsert_updates_name` | PUT updates name field |
| `test_patch_session_updates_luck` | PATCH partial update; other stats unchanged |
| `test_patch_session_not_found` | PATCH 404 |
| `test_delete_session` | DELETE 204; subsequent GET is 404 |
| `test_delete_session_not_found` | DELETE 404 |

### `test_actions.py` — `/api/sessions/{book}/actions` and logs (11 tests)

| Test | Covers |
|------|--------|
| `test_luck_test_decrements_luck` | POST luck_test → luck_current decremented by 1 |
| `test_luck_test_logs_action` | POST luck_test → action_type appears in GET logs |
| `test_luck_test_does_not_go_below_zero` | luck at 0 stays at 0 |
| `test_combat_round_enemy_hit_decrements_stamina` | enemy_hit → stamina_current -= 2 |
| `test_combat_round_player_hit_does_not_change_stamina` | player_hit → no stamina change |
| `test_combat_round_tie_does_not_change_stamina` | tie → no stamina change |
| `test_combat_round_stamina_does_not_go_below_zero` | stamina at 1 with enemy_hit → clamps to 0 |
| `test_get_logs_returns_newest_first` | GET logs returns `id DESC` order |
| `test_post_action_not_found` | POST action to missing session → 404 |
| `test_get_logs_not_found` | GET logs for missing session → 404 |
| `test_delete_session_cascades_logs` | DELETE session → logs endpoint returns 404 |

---

## Assertion Patterns

### Status codes always checked first
```python
assert r.status_code == 201
assert r.json()["book_number"] == 1
```

### Verify unchanged fields alongside changed ones
When testing a partial update, assert that modified fields changed AND that adjacent fields are unmodified:
```python
assert r.json()["luck"]["current"] == 7
assert r.json()["skill"]["current"] == 10  # unchanged
```

### Ordering verified with id comparison
```python
assert logs[0]["id"] > logs[1]["id"] > logs[2]["id"]
```

### Cascade delete verified with follow-up request
```python
session.delete("/api/sessions/1")
r = session.get("/api/sessions/1/logs")
assert r.status_code == 404
```

---

## What Is NOT Tested

### Frontend JavaScript — entirely untested
- `js/dice.js` — `roll()`, `rollMultiple()`, `rollInitialStats()` have no tests
- `js/mechanics.js` — luck/skill/stamina test logic, combat round calculation
- `js/storage.js` — localStorage fallback logic, server-vs-cache reconciliation
- `js/app.js` — stat modification guards (`newValue < 0`, `allowBonus` logic)
- `js/ui/` — all rendering and event binding

### Backend gaps
- `backend/routers/sessions.py` — `list_sessions` ordering by `book_number` not asserted
- `backend/routers/sessions.py` — `updated_at` timestamp is set in `upsert`/`patch` but never asserted in tests
- `backend/schemas.py` — `StatBlock` ge=0 validation (submitting negative values not tested)
- `backend/schemas.py` — `SessionCreate` ge=1 on `book_number` (book_number=0 not tested)
- `combat_start` and `combat_end` action types — only `combat_round` is tested in `test_actions.py`
- `skill_test` and `stamina_test` action types — no tests (the actions router only explicitly handles `luck_test`, `combat_round`, `combat_end`)
- `mechanics_json` field round-trip — not tested in any session test

---

## Adding New Tests

**Location:** `tests/test_<feature>.py`

**Import shared fixture and constant:**
```python
from .conftest import SESSION_BODY
```

**Use `client` fixture for tests that need full control of initial state:**
```python
def test_something(client):
    client.post("/api/sessions", json={**SESSION_BODY, "luck": {"initial": 9, "current": 2}})
    ...
```

**Use `session` fixture (from `test_actions.py`) for action tests that assume book 1 exists:**
```python
def test_something(session):
    r = session.post("/api/sessions/1/actions", json={...})
    ...
```

**Add new action-type fixtures** by creating a local fixture in the relevant test file following the `session` pattern.

---

## Gaps & Unknowns

- **No JS test runner configured.** No Jest, Vitest, or similar. Adding JS tests would require introducing a test runner and a browser API mock (for `document`, `localStorage`, `fetch`).
- **No coverage measurement.** No `pytest-cov` in `requirements-dev.txt`; no coverage thresholds enforced.
- **No integration tests for the legacy `/api/state` compat shim.** That router is documented in CLAUDE.md but not present in the current codebase.
- **Action types `skill_test`, `stamina_test`, `combat_start`, `combat_end`** are posted by the frontend but none of their state-mutation effects (or lack thereof) are covered by tests.
- **No performance or load tests.**
- **No end-to-end tests** (e.g., Playwright) for the full browser flow.
