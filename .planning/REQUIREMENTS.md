# Requirements — FF Console v1.1: Combat Modal

**Milestone:** v1.1 Combat Modal
**Created:** 2026-04-03
**Status:** Draft

---

## v1 Requirements

### Modal Trigger

- [x] **MODAL-01**: User can tap a "Start Battle" button on the adventure sheet to open the combat modal
- [x] **MODAL-02**: Combat is no longer rendered as an inline panel on the adventure sheet

### Combat Inside Modal

- [x] **MODAL-03**: Enemy setup form (name, Skill, Stamina inputs and Start Combat button) appears inside the modal
- [x] **MODAL-04**: Full round-by-round combat (roll button, luck prompts, stamina bars, flee) runs inside the modal
- [x] **MODAL-05**: Modal cannot be accidentally dismissed during active combat (backdrop tap and Escape are no-ops while a fight is in progress)

### Post-Combat

- [x] **MODAL-06**: Post-combat summary (Victory / Defeated / Fled, rounds, final stamina) is shown inside the modal before it closes
- [x] **MODAL-07**: User can tap a "Close" / "Return to Sheet" button to dismiss the modal after combat ends

### Battle History

- [x] **MODAL-08**: Battle history log remains on the adventure sheet (not inside the modal)
- [x] **MODAL-09**: History log refreshes automatically when the combat modal closes

### UX Polish

- [x] **MODAL-10**: Modal slides up from bottom on open and fades out on close (animation respects `prefers-reduced-motion`)
- [x] **MODAL-11**: Body scroll is locked while the modal is open; restored on close (iOS Safari safe)
- [x] **MODAL-12**: Focus moves into the modal on open (to first interactive element)

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

| REQ-ID | Phase | Status |
|--------|-------|--------|
| MODAL-01 | Phase 6 | Complete |
| MODAL-02 | Phase 6 | Complete |
| MODAL-03 | Phase 6 | Complete |
| MODAL-04 | Phase 7 | Complete |
| MODAL-05 | Phase 7 | Complete |
| MODAL-06 | Phase 8 | Complete |
| MODAL-07 | Phase 8 | Complete |
| MODAL-08 | Phase 8 | Complete |
| MODAL-09 | Phase 8 | Complete |
| MODAL-10 | Phase 7 | Complete |
| MODAL-11 | Phase 7 | Complete |
| MODAL-12 | Phase 7 | Complete |
