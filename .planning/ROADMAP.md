# Roadmap: FF Console

## Overview

Four phases take FF Console from its current partial state (stats sheet, persistence, stub combat UI) to a complete Fighting Fantasy companion app. Phase 1 establishes the infrastructure foundation — backend schema extension and app.js module split — that every subsequent phase depends on. Phase 2 delivers character creation and core mechanics (luck tests, dice roller). Phase 3 implements the battle system, the most complex feature. Phase 4 wires up book-specific configs for Books 17 and 30 as pure data files rendered by the dynamic mechanics section built in Phase 1.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Backend schema extension, config system, and app.js module split
- [ ] **Phase 2: Core Mechanics** - Character creation flow, Test Your Luck, and standalone dice roller
- [ ] **Phase 3: Battle System** - Full round-by-round combat panel with log persistence
- [ ] **Phase 4: Book Configs** - Book-specific mechanic configs for Appointment with F.E.A.R. and Chasms of Malice

## Phase Details

### Phase 1: Foundation
**Goal**: The codebase is ready to build features on — backend persists book-specific data, config system exists, and app.js has clean module boundaries
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. A session with extra book-mechanic fields saved to the backend survives a full page reload without data loss
  2. `getBookConfig(bookNumber)` resolves a config object for a supported book number via dynamic import
  3. `app.js` is reduced to an orchestrator; stats rendering lives in `ui/stats.js` with no circular imports
  4. Mobile combat buttons do not fire double events on tap
**Plans**: TBD
**UI hint**: yes

### Phase 2: Core Mechanics
**Goal**: Users can start a new character with proper FF stat generation, test their luck with a clear result, and roll dice at any time
**Depends on**: Phase 1
**Requirements**: CHAR-01, CHAR-02, CHAR-03, CHAR-04, CHAR-05, LUCK-01, LUCK-02, LUCK-03, DICE-01, DICE-02
**Success Criteria** (what must be TRUE):
  1. User can open a character creation flow, see individual die values animate on screen, enter a name, select a book, and confirm — resulting in a fully initialised adventure sheet
  2. Book-specific mechanics section activates automatically when a supported book is selected during character creation
  3. User can tap "Test Your Luck", see "Lucky" or "Unlucky" with the 2d6 values shown, and observe current Luck drop by exactly 1
  4. User can roll 1d6 or 2d6 from a standalone widget and see each die value individually
**Plans**: TBD
**UI hint**: yes

### Phase 3: Battle System
**Goal**: Users can conduct a full Fighting Fantasy combat — entering an enemy, resolving rounds, and reviewing the log — entirely within the adventure sheet
**Depends on**: Phase 2
**Requirements**: BATTLE-01, BATTLE-02, BATTLE-03, BATTLE-04, BATTLE-05, BATTLE-06, BATTLE-07, BATTLE-08
**Success Criteria** (what must be TRUE):
  1. User can enter an enemy name, Skill, and Stamina and start combat without leaving the adventure sheet
  2. Each round resolves with a single button tap, showing player roll, enemy roll, both Attack Strengths, who won, and Stamina damage applied
  3. Live Stamina bars for both player and enemy update after every round
  4. Combat ends automatically at 0 Stamina with a post-battle summary (outcome, rounds fought, damage dealt/received)
  5. User can flee combat (player loses 2 Stamina) and the fight ends
  6. Reloading the page or switching devices restores the full round-by-round log for the current session
**Plans**: TBD
**UI hint**: yes

### Phase 4: Book Configs
**Goal**: Players using Book 17 or Book 30 see the correct extra stats, resources, and trackers automatically applied to their adventure sheet
**Depends on**: Phase 3
**Requirements**: AFEAR-01, AFEAR-02, AFEAR-03, CHAOS-01, CHAOS-02, CHAOS-03, CHAOS-04, CHAOS-05
**Success Criteria** (what must be TRUE):
  1. A player who selects Book 17 during character creation sees Hero Points, a Superpower selector, and a Clue tracker on their adventure sheet
  2. A player who selects Book 30 during character creation sees Kuddam defeats, Provisions, Fuel, Tabasha restoration, Spells list, and Special abilities on their adventure sheet
  3. Extra mechanic fields persist correctly across page reloads (no silent data loss)
  4. Players on books without a config see an unmodified base adventure sheet
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/? | Not started | - |
| 2. Core Mechanics | 0/? | Not started | - |
| 3. Battle System | 0/? | Not started | - |
| 4. Book Configs | 0/? | Not started | - |
