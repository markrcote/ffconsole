# Phase 5: Luck-in-Combat Testing — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 05-luck-in-combat-testing
**Areas discussed:** UX trigger flow, Stamina sequencing, Round card display, Action log format

---

## UX Trigger Flow

### How should the player invoke luck mid-combat?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-prompt after each hit | After roll resolves, "Test Your Luck?" button appears below round card — disappears once luck is tested or next round starts | ✓ |
| Persistent button during active combat | "Test Luck" button stays visible whenever combat is active | |
| You decide | Claude picks based on mobile-first UX | |

**User's choice:** Auto-prompt after each hit

### Should luck be offered after both directions of hit?

| Option | Description | Selected |
|--------|-------------|----------|
| Both directions | Offered after player_hit AND enemy_hit — matches standard FF rules | ✓ |
| Enemy hits only | Only when player is wounded | |
| Player hits only | Only when player lands a blow | |

**User's choice:** Both directions

---

## Stamina Sequencing

### When should stamina bars update relative to the luck test?

| Option | Description | Selected |
|--------|-------------|----------|
| Pause before applying damage | Hold off on stamina damage until after luck test resolves | |
| Apply damage immediately, adjust after luck | Standard 2 damage applied right away; luck test adjusts up or down after | ✓ |
| You decide | Claude picks simplest clean implementation | |

**User's choice:** Apply damage immediately, adjust after luck

### What happens if player skips luck test and rolls next round?

| Option | Description | Selected |
|--------|-------------|----------|
| Luck prompt disappears, standard damage stands | Once player hits Roll Round, luck opportunity is forfeit — no state to track | ✓ |
| Luck opportunity persists until explicitly dismissed | Player must tap Skip before next round becomes available | |

**User's choice:** Luck prompt disappears, standard damage stands

---

## Round Card Display

### After a luck test, how should the result appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Append luck result to existing round card | Round card updates in-place with a luck row | ✓ |
| Separate luck card below round card | New card appears after the round card | |

**User's choice:** Append luck result to existing round card

### What wording for luck-in-combat result?

| Option | Description | Selected |
|--------|-------------|----------|
| Lucky/Unlucky with damage shown | "Lucky! Damage reduced to 1 Stamina" / "Unlucky! You take 3 Stamina damage" | ✓ |
| Just the damage change | "Luck test: 1 Stamina (reduced)" — mechanical, no label | |

**User's choice:** Lucky/Unlucky with damage shown

---

## Action Log Format

### How should luck-in-combat be stored in the action log?

| Option | Description | Selected |
|--------|-------------|----------|
| New combat_luck_test action type | Distinct from luck_test; includes round, context, roll, success, luck_after, damage_before, damage_after | ✓ |
| Reuse luck_test with combat context | Add extra fields to existing luck_test action type | |

**User's choice:** New combat_luck_test action type

### Should Past Battles history show luck tests per round?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, show luck in round entries | Round log entries show luck result inline: "R3: AS 12 vs 10 — You hit — Lucky (1 dmg)" | ✓ |
| No, keep round entries compact | Luck detail omitted from history | |

**User's choice:** Yes, show luck in round entries

---

## Claude's Discretion

- Exact CSS class naming for the luck row appended to the round card
- Whether the "Test Your Luck?" button is inline in the round card or floated below it
- Whether `combat_luck_test` triggers a session update (should — luck stat changes)

## Deferred Ideas

None.
