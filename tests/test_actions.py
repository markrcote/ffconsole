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


def test_log_details_are_stored_and_retrievable(session):
    details = {"roll": 4, "target": 9, "success": True, "luck_after": 8}
    session.post("/api/sessions/1/actions", json={
        "action_type": "luck_test",
        "details": details,
    })
    logs = session.get("/api/sessions/1/logs").json()
    assert logs[0]["details"] == details


def test_unknown_action_type_logs_without_stat_change(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "custom_event",
        "details": {"note": "found a sword"},
    })
    assert r.status_code == 201
    data = r.json()
    # Stats unchanged
    assert data["session"]["stamina"]["current"] == 20
    assert data["session"]["skill"]["current"] == 10
    assert data["session"]["luck"]["current"] == 9
    # But the log was recorded
    assert data["log"]["action_type"] == "custom_event"


# --- combat_end tests ---

def test_combat_end_fled_decrements_stamina(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_end",
        "details": {"winner": "fled", "enemy_name": "Orc"},
    })
    assert r.status_code == 201
    assert r.json()["session"]["stamina"]["current"] == 18  # 20 - 2


def test_combat_end_fled_stamina_does_not_go_below_zero(client):
    client.post("/api/sessions", json={
        **SESSION_BODY,
        "stamina": {"initial": 20, "current": 1},
    })
    r = client.post("/api/sessions/1/actions", json={
        "action_type": "combat_end",
        "details": {"winner": "fled", "enemy_name": "Orc"},
    })
    assert r.json()["session"]["stamina"]["current"] == 0


def test_combat_end_player_wins_does_not_change_stats(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_end",
        "details": {"winner": "player", "enemy_name": "Goblin"},
    })
    assert r.status_code == 201
    assert r.json()["session"]["stamina"]["current"] == 20


def test_combat_end_enemy_wins_does_not_change_stats(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_end",
        "details": {"winner": "enemy", "enemy_name": "Dragon"},
    })
    assert r.status_code == 201
    assert r.json()["session"]["stamina"]["current"] == 20


# --- combat_luck_test tests ---

def test_combat_luck_test_decrements_luck(session):
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_luck_test",
        "details": {
            "context": "wounding", "roll": 5, "target": 9,
            "success": True, "luck_after": 8,
            "damage_before": 2, "damage_after": 4,
        },
    })
    assert r.status_code == 201
    assert r.json()["session"]["luck"]["current"] == 8  # 9 - 1


def test_combat_luck_test_wounded_lucky_restores_stamina(session):
    # Enemy hit player (wounded). Lucky reduces damage: 2 -> 1, so player gains 1 stamina back.
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_luck_test",
        "details": {
            "context": "wounded", "roll": 5, "target": 9,
            "success": True, "luck_after": 8,
            "damage_before": 2, "damage_after": 1,
        },
    })
    assert r.status_code == 201
    assert r.json()["session"]["stamina"]["current"] == 21  # 20 + (2 - 1)


def test_combat_luck_test_wounded_unlucky_extra_damage(session):
    # Enemy hit player (wounded). Unlucky increases damage: 2 -> 3, so player loses 1 more stamina.
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_luck_test",
        "details": {
            "context": "wounded", "roll": 10, "target": 9,
            "success": False, "luck_after": 8,
            "damage_before": 2, "damage_after": 3,
        },
    })
    assert r.status_code == 201
    assert r.json()["session"]["stamina"]["current"] == 19  # 20 + (2 - 3)


def test_combat_luck_test_wounded_stamina_does_not_go_below_zero(client):
    client.post("/api/sessions", json={
        **SESSION_BODY,
        "stamina": {"initial": 20, "current": 1},
    })
    # Unlucky: damage goes from 2 to 3, but stamina is only 1 so it floors at 0.
    r = client.post("/api/sessions/1/actions", json={
        "action_type": "combat_luck_test",
        "details": {
            "context": "wounded", "roll": 10, "target": 9,
            "success": False, "luck_after": 8,
            "damage_before": 2, "damage_after": 3,
        },
    })
    assert r.json()["session"]["stamina"]["current"] == 0


def test_combat_luck_test_wounding_does_not_change_stamina(session):
    # Player hit enemy (wounding). Server does not change player stamina.
    r = session.post("/api/sessions/1/actions", json={
        "action_type": "combat_luck_test",
        "details": {
            "context": "wounding", "roll": 5, "target": 9,
            "success": True, "luck_after": 8,
            "damage_before": 2, "damage_after": 4,
        },
    })
    assert r.status_code == 201
    assert r.json()["session"]["stamina"]["current"] == 20  # unchanged
