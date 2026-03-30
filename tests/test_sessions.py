from .conftest import SESSION_BODY


def test_list_sessions_empty(client):
    r = client.get("/api/sessions")
    assert r.status_code == 200
    assert r.json() == []


def test_create_session(client):
    r = client.post("/api/sessions", json=SESSION_BODY)
    assert r.status_code == 201
    data = r.json()
    assert data["book_number"] == 1
    assert data["skill"] == {"initial": 10, "current": 10}
    assert data["stamina"] == {"initial": 20, "current": 20}
    assert data["luck"] == {"initial": 9, "current": 9}
    assert data["name"] is None


def test_create_session_with_name(client):
    body = {**SESSION_BODY, "name": "Alaric"}
    r = client.post("/api/sessions", json=body)
    assert r.status_code == 201
    assert r.json()["name"] == "Alaric"


def test_create_duplicate_session_returns_409(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.post("/api/sessions", json=SESSION_BODY)
    assert r.status_code == 409


def test_get_session(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.get("/api/sessions/1")
    assert r.status_code == 200
    assert r.json()["book_number"] == 1


def test_get_session_not_found(client):
    r = client.get("/api/sessions/99")
    assert r.status_code == 404


def test_list_sessions_returns_created(client):
    client.post("/api/sessions", json=SESSION_BODY)
    client.post("/api/sessions", json={**SESSION_BODY, "book_number": 2})
    r = client.get("/api/sessions")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_upsert_creates_new_session(client):
    r = client.put("/api/sessions/1", json=SESSION_BODY)
    assert r.status_code == 200
    assert r.json()["book_number"] == 1


def test_upsert_updates_existing_session(client):
    client.post("/api/sessions", json=SESSION_BODY)
    updated = {**SESSION_BODY, "stamina": {"initial": 20, "current": 14}}
    r = client.put("/api/sessions/1", json=updated)
    assert r.status_code == 200
    assert r.json()["stamina"]["current"] == 14


def test_upsert_updates_name(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.put("/api/sessions/1", json={**SESSION_BODY, "name": "Balthazar"})
    assert r.status_code == 200
    assert r.json()["name"] == "Balthazar"


def test_patch_session_updates_luck(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.patch("/api/sessions/1", json={"luck": {"initial": 9, "current": 7}})
    assert r.status_code == 200
    assert r.json()["luck"]["current"] == 7
    assert r.json()["skill"]["current"] == 10  # unchanged


def test_patch_session_not_found(client):
    r = client.patch("/api/sessions/99", json={"luck": {"initial": 9, "current": 7}})
    assert r.status_code == 404


def test_delete_session(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.delete("/api/sessions/1")
    assert r.status_code == 204
    assert client.get("/api/sessions/1").status_code == 404


def test_delete_session_not_found(client):
    r = client.delete("/api/sessions/99")
    assert r.status_code == 404
