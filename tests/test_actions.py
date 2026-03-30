import pytest
from .conftest import SESSION_BODY


@pytest.fixture
def session(client):
    client.post("/api/sessions", json=SESSION_BODY)
    return client


def test_luck_test_decrements_luck(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "luck_test",
        "details": {"roll": 7, "target": 9, "success": True, "luck_after": 8},
    })
    assert r.status_code == 201
    assert r.json()["session"]["luck"]["current"] == 8  # 9 - 1


def test_luck_test_logs_action(session):
    session.post("/api/sessions/1/actions", json={
        "action_type": "luck_test",
        "details": {"roll": 7, "target": 9, "success": True, "luck_after": 8},
    })
    logs = session.get("/api/sessions/1/logs").json()
    assert len(logs) == 1
    assert logs[0]["action_type"] == "luck_test"


def test_luck_test_does_not_go_below_zero(client):
    client.post("/api/sessions", json={
        **SESSION_BODY,
        "luck": {"initial": 9, "current": 0},
    })
    r = client.post("/api/sessions/1/actions", json={
        "action_type": "luck_test",
        "details": {"roll": 5, "target": 0, "success": False, "luck_after": 0},
    })
    assert r.json()["session"]["luck"]["current"] == 0


def test_combat_round_enemy_hit_decrements_stamina(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_round",
        "details": {
            "round": 1, "result": "enemy_hit",
            "player_roll": 9, "enemy_roll": 7,
            "player_attack": 19, "enemy_attack": 16,
            "player_stamina_after": None, "enemy_stamina_after": 6,
            "enemy_name": "Goblin",
        },
    })
    assert r.status_code == 201
    assert r.json()["session"]["stamina"]["current"] == 18  # 20 - 2


def test_combat_round_player_hit_does_not_change_stamina(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_round",
        "details": {
            "round": 1, "result": "player_hit",
            "player_roll": 7, "enemy_roll": 9,
            "player_attack": 17, "enemy_attack": 18,
            "player_stamina_after": None, "enemy_stamina_after": 6,
            "enemy_name": "Goblin",
        },
    })
    assert r.json()["session"]["stamina"]["current"] == 20  # unchanged


def test_combat_round_tie_does_not_change_stamina(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_round",
        "details": {
            "round": 1, "result": "tie",
            "player_roll": 8, "enemy_roll": 8,
            "player_attack": 18, "enemy_attack": 18,
            "player_stamina_after": None, "enemy_stamina_after": 8,
            "enemy_name": "Goblin",
        },
    })
    assert r.json()["session"]["stamina"]["current"] == 20  # unchanged


def test_combat_round_stamina_does_not_go_below_zero(client):
    client.post("/api/sessions", json={
        **SESSION_BODY,
        "stamina": {"initial": 20, "current": 1},
    })
    r = client.post("/api/sessions/1/actions", json={
        "action_type": "combat_round",
        "details": {
            "round": 1, "result": "enemy_hit",
            "player_roll": 7, "enemy_roll": 9,
            "player_attack": 17, "enemy_attack": 18,
            "player_stamina_after": None, "enemy_stamina_after": 6,
            "enemy_name": "Goblin",
        },
    })
    assert r.json()["session"]["stamina"]["current"] == 0


def test_get_logs_returns_newest_first(session):
    for i in range(3):
        session.post("/api/sessions/1/actions", json={
            "action_type": "luck_test",
            "details": {"roll": i + 2, "target": 9, "success": True, "luck_after": 9 - i - 1},
        })
    logs = session.get("/api/sessions/1/logs").json()
    assert len(logs) == 3
    assert logs[0]["id"] > logs[1]["id"] > logs[2]["id"]


def test_post_action_not_found(client):
    r = client.post("/api/sessions/99/actions", json={
        "action_type": "luck_test",
        "details": {},
    })
    assert r.status_code == 404


def test_get_logs_not_found(client):
    r = client.get("/api/sessions/99/logs")
    assert r.status_code == 404


def test_delete_session_cascades_logs(session):
    session.post("/api/sessions/1/actions", json={
        "action_type": "luck_test",
        "details": {"roll": 5, "target": 9, "success": True, "luck_after": 8},
    })
    session.delete("/api/sessions/1")
    # Session gone — logs endpoint should 404
    r = session.get("/api/sessions/1/logs")
    assert r.status_code == 404
