# Requirements — FF Console v1.1: Combat Modal

**Milestone:** v1.1 Combat Modal
**Created:** 2026-04-03
**Status:** Draft

---

## v1 Requirements

### Modal Trigger

- [ ] **MODAL-01**: User can tap a "Start Battle" button on the adventure sheet to open the combat modal
- [ ] **MODAL-02**: Combat is no longer rendered as an inline panel on the adventure sheet

### Combat Inside Modal

- [ ] **MODAL-03**: Enemy setup form (name, Skill, Stamina inputs and Start Combat button) appears inside the modal
- [ ] **MODAL-04**: Full round-by-round combat (roll button, luck prompts, stamina bars, flee) runs inside the modal
- [ ] **MODAL-05**: Modal cannot be accidentally dismissed during active combat (backdrop tap and Escape are no-ops while a fight is in progress)

### Post-Combat

- [ ] **MODAL-06**: Post-combat summary (Victory / Defeated / Fled, rounds, final stamina) is shown inside the modal before it closes
- [ ] **MODAL-07**: User can tap a "Close" / "Return to Sheet" button to dismiss the modal after combat ends

### Battle History

- [ ] **MODAL-08**: Battle history log remains on the adventure sheet (not inside the modal)
- [ ] **MODAL-09**: History log refreshes automatically when the combat modal closes

### UX Polish

- [ ] **MODAL-10**: Modal slides up from bottom on open and fades out on close (animation respects `prefers-reduced-motion`)
- [ ] **MODAL-11**: Body scroll is locked while the modal is open; restored on close (iOS Safari safe)
- [ ] **MODAL-12**: Focus moves into the modal on open (to first interactive element)

---

## Future Requirements

- Full Tab trap + `aria-modal` + `inert` on background sheet (accessibility — deferred)
- "New Battle" inside modal resets to setup without closing (explicit UX decision — defer until v1.1 ships to validate post-summary flow)

---

## Out of Scope

- New combat mechanics — this milestone is a UX restructure only; no mechanic changes
- Additional book configs — separate track
- Multiplayer / shared sessions

---

## Traceability

| REQ-ID | Phase |
|--------|-------|
| MODAL-01 | TBD |
| MODAL-02 | TBD |
| MODAL-03 | TBD |
| MODAL-04 | TBD |
| MODAL-05 | TBD |
| MODAL-06 | TBD |
| MODAL-07 | TBD |
| MODAL-08 | TBD |
| MODAL-09 | TBD |
| MODAL-10 | TBD |
| MODAL-11 | TBD |
| MODAL-12 | TBD |
