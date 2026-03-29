# Requirements: FF Console

**Defined:** 2026-03-28
**Core Value:** Complete, accurate mechanical support for playing Fighting Fantasy — the app should never be the bottleneck when you need to resolve a combat, test your luck, or roll some dice.

---

## v1 Requirements

### Character Creation

- [x] **CHAR-01**: User can initiate character creation and see dice rolled with individual die values visible (not just the total)
- [x] **CHAR-02**: User can select which Fighting Fantasy book they are playing before stats are finalised
- [x] **CHAR-03**: User can enter an optional character name
- [x] **CHAR-04**: Stats are generated per FF rules: Skill = 1d6+6, Stamina = 2d6+12, Luck = 1d6+6
- [x] **CHAR-05**: Character creation activates book-specific mechanics section for supported books

### Battle System

- [ ] **BATTLE-01**: User can start a battle by entering an enemy's name, Skill, and Stamina
- [ ] **BATTLE-02**: User can resolve a combat round with a single roll button that rolls for both player and enemy, calculates Attack Strengths, and determines the winner
- [ ] **BATTLE-03**: Each round result is displayed showing: player roll, enemy roll, both Attack Strengths, who won, Stamina damage applied
- [ ] **BATTLE-04**: Live Stamina bars for both player and enemy update after each round
- [ ] **BATTLE-05**: User can flee combat (player loses 2 Stamina)
- [ ] **BATTLE-06**: Combat ends automatically when either side reaches 0 Stamina, displaying a post-battle summary (outcome, rounds, damage dealt/received)
- [ ] **BATTLE-07**: Round-by-round log persists to the backend and is visible when returning to a session on any device
- [ ] **BATTLE-08**: User can review combat history from previous battles in the current session

### Test Your Luck

- [ ] **LUCK-01**: User can Test their Luck at any time via a dedicated button
- [x] **LUCK-02**: Result is displayed clearly as "Lucky" or "Unlucky" with the 2d6 roll shown
- [ ] **LUCK-03**: Current Luck value decreases by 1 and updates visibly after every test, regardless of outcome

### Dice Roller

- [x] **DICE-01**: User can roll 1d6 or 2d6 at any time from a standalone widget
- [x] **DICE-02**: Individual die values are shown (not just the total for 2d6)

### Infrastructure

- [x] **INFRA-01**: Backend Session model stores book-specific mechanic state in a `mechanics_json` field so extra stats are not lost on save/load
- [x] **INFRA-02**: Config system (`js/config/mechanics/`) with a shared schema and `getBookConfig(bookNumber)` loader using dynamic import
- [x] **INFRA-03**: `app.js` is refactored into focused modules (`ui/stats.js`, `ui/charCreate.js`, `ui/battle.js`, `ui/diceRoller.js`) with no circular dependencies

### Book: Appointment with F.E.A.R. (Book 17)

- [ ] **AFEAR-01**: Hero Points stat is shown and adjustable when playing Book 17
- [ ] **AFEAR-02**: Superpower can be chosen at character creation for Book 17
- [ ] **AFEAR-03**: Clue tracker is visible when playing Book 17

### Book: Chasms of Malice (Book 30)

- [ ] **CHAOS-01**: Kuddam defeats counter is shown when playing Book 30
- [ ] **CHAOS-02**: Provisions and Fuel resource trackers are shown when playing Book 30
- [ ] **CHAOS-03**: Tabasha the Bazouk restoration tracker is shown when playing Book 30
- [ ] **CHAOS-04**: Spells list is shown when playing Book 30
- [ ] **CHAOS-05**: Special abilities tracker is shown when playing Book 30

---

## v2 Requirements

### Book: Freeway Fighter (Book 13)

- Body Points (vehicle HP) stat
- Fuel and Ammo resource trackers
- Vehicle and shooting combat variants

### Future Book Configs

- User-configurable book mechanics (define extra stats and resources for any book)
- Additional built-in book configs

### Enhanced Combat

- Optional flee free-attack (enemy strikes before player escapes, book-dependent)
- Multi-enemy combat (fighting more than one enemy simultaneously)

### Quality of Life

- Provisions tracker in base mechanics (restore 4 Stamina, cannot exceed initial)
- Session history / adventure log

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Freeway Fighter (Book 13) | Deferred — most complex book config; punted to v2 |
| User accounts / authentication | Single-player; no account system needed |
| Multiplayer / shared sessions | Single-player only |
| Rulebook / story text | Mechanics companion only, not a digital edition |
| Non-FF gamebook systems | FF only |
| Animated 3D dice | Complexity without value; numbers are what matter |
| Undo/redo | Manual stat adjustment covers the need |
| Paragraph tracker | Story navigation is in the book |
| Sound effects | Scope |

---

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| CHAR-01 | Phase 2 | Complete |
| CHAR-02 | Phase 2 | Complete |
| CHAR-03 | Phase 2 | Complete |
| CHAR-04 | Phase 2 | Complete |
| CHAR-05 | Phase 2 | Complete |
| LUCK-01 | Phase 2 | Pending |
| LUCK-02 | Phase 2 | Complete |
| LUCK-03 | Phase 2 | Pending |
| DICE-01 | Phase 2 | Complete |
| DICE-02 | Phase 2 | Complete |
| BATTLE-01 | Phase 3 | Pending |
| BATTLE-02 | Phase 3 | Pending |
| BATTLE-03 | Phase 3 | Pending |
| BATTLE-04 | Phase 3 | Pending |
| BATTLE-05 | Phase 3 | Pending |
| BATTLE-06 | Phase 3 | Pending |
| BATTLE-07 | Phase 3 | Pending |
| BATTLE-08 | Phase 3 | Pending |
| AFEAR-01 | Phase 4 | Pending |
| AFEAR-02 | Phase 4 | Pending |
| AFEAR-03 | Phase 4 | Pending |
| CHAOS-01 | Phase 4 | Pending |
| CHAOS-02 | Phase 4 | Pending |
| CHAOS-03 | Phase 4 | Pending |
| CHAOS-04 | Phase 4 | Pending |
| CHAOS-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29 ✓
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
