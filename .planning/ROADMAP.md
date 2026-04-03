# Roadmap: FF Console

## Milestones

- ✅ **v1.0 MVP** — Phases 1–4 (shipped 2026-04-02)
- ✅ **v1.1 Combat Modal** — Phases 5–8 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–4) — SHIPPED 2026-04-02</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-03-29
- [x] Phase 2: Core Mechanics (6/6 plans) — completed 2026-03-30
- [x] Phase 3: Battle System (5/5 plans) — completed 2026-03-31
- [x] Phase 4: Book Configs (3/3 plans) — completed 2026-04-02

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Combat Modal (In Progress)

**Milestone Goal:** Move combat out of the inline sheet panel into a focused modal overlay. The adventure sheet stays behind the modal; the player returns to it cleanly when combat ends.

- [x] **Phase 5: Luck-in-Combat Testing** — Optional luck test during combat rounds; Lucky/Unlucky modifies damage; Luck decrements either way
- [ ] **Phase 6: Module Restructure and DOM Cleanup** — Scope battle.js to a container argument; introduce battleModal.js skeleton; wire "Start Battle" trigger
- [ ] **Phase 7: Modal Lifecycle and UX** — Full open/close lifecycle with scroll lock, dismiss guards, animations, and focus management
- [ ] **Phase 8: Post-Combat Flow and History** — Summary screen inside modal, explicit Close button, history refresh on sheet

## Phase Details

### Phase 5: Luck-in-Combat Testing
**Goal**: Players can test their Luck during combat to modify damage dealt or taken
**Depends on**: Phase 4
**Requirements**: LUCK-01, LUCK-02, LUCK-03, LUCK-04, LUCK-05, LUCK-06, LUCK-07
**Success Criteria** (what must be TRUE):
  1. After landing a hit, player can tap "Test Luck" to apply Lucky/Unlucky damage modifier
  2. After taking a hit, player can tap "Test Luck" to reduce or increase damage taken
  3. Luck decrements by 1 regardless of the roll outcome
  4. Combat round card shows the luck result and final damage value
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — testCombatLuck mechanic function + backend handler
- [x] 05-02-PLAN.md — Battle UI luck prompt, round card display, history rendering, CSS, app.js wiring

### Phase 6: Module Restructure and DOM Cleanup
**Goal**: The combat module is cleanly separated from the static adventure sheet DOM, with a container-scoped rendering API and a "Start Battle" trigger wired in the UI
**Depends on**: Phase 5
**Requirements**: MODAL-01, MODAL-02, MODAL-03
**Success Criteria** (what must be TRUE):
  1. A "Start Battle" button is visible on the adventure sheet and tappable
  2. The inline combat panel no longer appears on the adventure sheet (replaced by the trigger button)
  3. The enemy setup form (name, Skill, Stamina inputs) renders correctly when passed a container element
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 06-01-PLAN.md — Refactor battle.js: migrate all document.getElementById() to container-scoped queries
- [ ] 06-02-PLAN.md — Create battleModal.js skeleton, remove inline combat from index.html, add Start Battle trigger, rewire app.js

### Phase 7: Modal Lifecycle and UX
**Goal**: The combat modal opens and closes correctly with proper scroll lock, dismiss guards, animation, and focus management — the player cannot accidentally lose a fight in progress by dismissing the modal
**Depends on**: Phase 6
**Requirements**: MODAL-04, MODAL-05, MODAL-10, MODAL-11, MODAL-12
**Success Criteria** (what must be TRUE):
  1. Tapping "Start Battle" opens a full-screen overlay and locks background scroll (including on iOS Safari)
  2. Full round-by-round combat (roll, luck prompts, stamina bars, flee) runs correctly inside the modal
  3. Tapping the backdrop or pressing Escape during active combat does nothing (no accidental dismissal)
  4. The modal slides up on open and fades out on close; neither animation plays when prefers-reduced-motion is set
  5. Focus moves to the enemy name input when the modal opens
**Plans**: TBD
**UI hint**: yes

### Phase 8: Post-Combat Flow and History
**Goal**: Combat ends with a readable summary inside the modal; the player explicitly closes it; the sheet's battle history updates automatically to reflect the completed fight
**Depends on**: Phase 7
**Requirements**: MODAL-06, MODAL-07, MODAL-08, MODAL-09
**Success Criteria** (what must be TRUE):
  1. After combat ends (Victory, Defeated, or Fled), a summary showing outcome, round count, and final Stamina values is shown inside the modal
  2. A "Close" / "Return to Sheet" button is the only way to dismiss the modal after combat — backdrop and Escape remain blocked
  3. The battle history log on the adventure sheet (outside the modal) is visible and up to date immediately after the modal closes
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-29 |
| 2. Core Mechanics | v1.0 | 6/6 | Complete | 2026-03-30 |
| 3. Battle System | v1.0 | 5/5 | Complete | 2026-03-31 |
| 4. Book Configs | v1.0 | 3/3 | Complete | 2026-04-02 |
| 5. Luck-in-combat testing | v1.1 | 2/2 | Complete | 2026-04-03 |
| 6. Module Restructure and DOM Cleanup | v1.1 | 1/2 | In Progress|  |
| 7. Modal Lifecycle and UX | v1.1 | 0/? | Not started | — |
| 8. Post-Combat Flow and History | v1.1 | 0/? | Not started | — |

## Backlog

_(empty)_
