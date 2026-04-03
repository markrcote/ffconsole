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


# --- mechanics field ---

def test_create_session_with_mechanics(client):
    body = {**SESSION_BODY, "mechanics": {"extraStat": 5}}
    r = client.post("/api/sessions", json=body)
    assert r.status_code == 201
    assert r.json()["mechanics"] == {"extraStat": 5}


def test_upsert_session_persists_mechanics(client):
    body = {**SESSION_BODY, "mechanics": {"resource": 3}}
    r = client.put("/api/sessions/1", json=body)
    assert r.status_code == 200
    assert r.json()["mechanics"] == {"resource": 3}


def test_patch_session_updates_mechanics(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.patch("/api/sessions/1", json={"mechanics": {"honor": 10}})
    assert r.status_code == 200
    assert r.json()["mechanics"] == {"honor": 10}
    assert r.json()["stamina"]["current"] == 20  # unchanged


# --- PATCH partial-field tests ---

def test_patch_session_updates_only_skill(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.patch("/api/sessions/1", json={"skill": {"initial": 10, "current": 8}})
    assert r.status_code == 200
    assert r.json()["skill"]["current"] == 8
    assert r.json()["stamina"]["current"] == 20  # unchanged
    assert r.json()["luck"]["current"] == 9      # unchanged


def test_patch_session_updates_only_stamina(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.patch("/api/sessions/1", json={"stamina": {"initial": 20, "current": 15}})
    assert r.status_code == 200
    assert r.json()["stamina"]["current"] == 15
    assert r.json()["skill"]["current"] == 10    # unchanged
    assert r.json()["luck"]["current"] == 9      # unchanged


def test_patch_session_updates_only_name(client):
    client.post("/api/sessions", json=SESSION_BODY)
    r = client.patch("/api/sessions/1", json={"name": "Zanbar"})
    assert r.status_code == 200
    assert r.json()["name"] == "Zanbar"
    assert r.json()["stamina"]["current"] == 20  # unchanged


# --- list ordering ---

def test_list_sessions_ordered_by_book_number(client):
    client.post("/api/sessions", json={**SESSION_BODY, "book_number": 5})
    client.post("/api/sessions", json={**SESSION_BODY, "book_number": 1})
    client.post("/api/sessions", json={**SESSION_BODY, "book_number": 3})
    r = client.get("/api/sessions")
    assert r.status_code == 200
    book_numbers = [s["book_number"] for s in r.json()]
    assert book_numbers == sorted(book_numbers)


# --- input validation ---

def test_create_session_rejects_book_number_zero(client):
    body = {**SESSION_BODY, "book_number": 0}
    r = client.post("/api/sessions", json=body)
    assert r.status_code == 422


def test_create_session_rejects_negative_stat(client):
    body = {**SESSION_BODY, "skill": {"initial": -1, "current": 10}}
    r = client.post("/api/sessions", json=body)
    assert r.status_code == 422
