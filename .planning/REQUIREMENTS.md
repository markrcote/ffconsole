# Requirements — FF Console v1.2: Defeat State

**Milestone:** v1.2 Defeat State
**Created:** 2026-04-06
**Status:** Draft

---

## v1 Requirements

### Defeat Detection

- [ ] **DEFEAT-01**: App automatically detects defeat when player Stamina reaches 0 during combat
- [ ] **DEFEAT-02**: App automatically detects defeat when player Stamina is reduced to 0 via sheet stat buttons

### Combat Modal Defeat

- [ ] **DEFEAT-03**: When combat ends in defeat, a defeat screen appears inside the modal, visually distinct from the victory summary
- [ ] **DEFEAT-04**: After the defeat screen is dismissed, the modal closes and the adventure sheet shows a dead state

### Sheet Defeat State

- [ ] **DEFEAT-05**: When Stamina hits 0 via sheet buttons, the adventure sheet immediately shows a dead state
- [ ] **DEFEAT-06**: Sheet-triggered dead state includes an Undo action to reverse the Stamina change (misclick protection)
- [ ] **DEFEAT-07**: Dead state is visually unambiguous — the sheet clearly communicates the character is dead, not just at low Stamina

### Recovery Actions

- [ ] **DEFEAT-08**: From the dead state, player can choose "Restart" to re-roll a new character for the same book (triggers char creation flow)
- [ ] **DEFEAT-09**: From the dead state, player can choose "Change Book" to delete the current session and return to the book picker

---

## Future Requirements

- Undo history (multi-step undo) — single-step undo covers misclick protection for v1.2
- "New Battle" inside modal resets to setup without closing — deferred from v1.1
- Full Tab trap + `aria-modal` + `inert` on background sheet (accessibility — deferred)

---

## Out of Scope

- Manual "I am dead" button — defeat detection is automatic
- Session archiving / graveyard — delete on "Change Book" is sufficient for v1.2
- Multiplayer / shared sessions

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DEFEAT-01 | TBD | Pending |
| DEFEAT-02 | TBD | Pending |
| DEFEAT-03 | TBD | Pending |
| DEFEAT-04 | TBD | Pending |
| DEFEAT-05 | TBD | Pending |
| DEFEAT-06 | TBD | Pending |
| DEFEAT-07 | TBD | Pending |
| DEFEAT-08 | TBD | Pending |
| DEFEAT-09 | TBD | Pending |
