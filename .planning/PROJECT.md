# FF Console

## What This Is

A web-based companion app for Fighting Fantasy gamebooks by Steve Jackson and Ian Livingstone. It handles the mechanics so you can focus on the adventure: character creation, combat, luck tests, dice rolls, and book-specific mechanics for individual titles. v1.0 ships full support for Books 17 (Appointment with F.E.A.R.) and 30 (Chasms of Malice).

## Core Value

Complete, accurate mechanical support for playing Fighting Fantasy — the app should never be the bottleneck when you need to resolve a combat, test your luck, or roll some dice.

## Current Milestone: v1.2 Defeat State

**Goal:** Make defeat unambiguous and give the player clear paths forward.

**Target features:**
- Automatic defeat detection when Stamina hits 0 (combat modal + adventure sheet)
- Defeat screen inside combat modal → sheet enters dead state after modal closes
- Sheet-level defeat shows dead state with an Undo option (misclick protection)
- Dead state on adventure sheet with two clear actions: "Restart" (re-roll stats, same book) and "Change Book" (delete session, return to book picker)

## Current State

**Phase 8 complete** — 2026-04-03 — Post-combat flow and history refresh wired

- ~1,470 LOC JavaScript (vanilla ES modules), ~400 LOC Python (FastAPI), ~1,260 LOC CSS
- 8 phases, 25 plans completed
- Full feature set: character creation, luck tests (standalone + in-combat), dice roller, battle system (modal with full lifecycle + post-combat summary), book-specific mechanics
- Battle modal: scroll lock (iOS Safari safe), slide-up/fade-out animations (300ms), focus management, dismiss guard (shakes during combat AND during post-combat summary), "Return to Sheet" sole dismiss path after combat, history refreshes on modal close
- Validated in Phase 7: MODAL-04, MODAL-05, MODAL-10, MODAL-11, MODAL-12
- Validated in Phase 8: MODAL-06, MODAL-07, MODAL-08, MODAL-09

**Tech stack:** Vanilla JS ES modules, FastAPI/SQLite, no build step, mobile-first

## Requirements

### Validated

- ✓ Character stats tracking (Skill, Stamina, Luck with initial/current values) — v1.0
- ✓ Stat adjustment (+/- buttons, long-press for bonus above initial) — v1.0
- ✓ Dice rolling utilities (rollInitialStats per FF rules) — v1.0
- ✓ State persistence (FastAPI backend + localStorage fallback) — v1.0
- ✓ Action/event logging infrastructure (ActionLog model, /api/sessions/{book}/actions) — v1.0
- ✓ Book catalog (books.js with FF book search) — v1.0
- ✓ Character creation flow: roll stats (Skill 1d6+6, Stamina 2d6+12, Luck 1d6+6) with visible dice, name entry, book selection — v1.0
- ✓ Test Your Luck: roll 2d6 ≤ current Luck = Lucky, Luck -1 either way, clear result display — v1.0
- ✓ Dice roller: standalone roll any combination (1d6, 2d6) with result shown — v1.0
- ✓ Battle system: panel on adventure sheet, enter enemy name/Skill/Stamina, combat round-by-round with roll buttons, live Stamina bars, persistent round log, post-battle summary — v1.0
- ✓ Book 17 (Appointment with F.E.A.R.): Hero Points stat, Superpower picker at char create, freeform Clues list — v1.0
- ✓ Book 30 (Chasms of Malice): Kuddam named checklist (7 enemies), Tabasha panel (Skill/Luck picker + one-time restore + 8 encounter slots), freeform Spells/Special Abilities, Cyphers textarea, Provisions/Fuel resources — v1.0

### Active

- ✓ Luck-in-combat testing: test Luck when wounding/wounded; Lucky/Unlucky modifies damage dealt/taken; costs 1 Luck regardless of outcome — Phase 5
- [ ] Defeat state: automatic detection when Stamina = 0, defeat screen in modal + dead state on sheet, Restart (re-roll) and Change Book (delete session) options
- [ ] Additional book configs (Book 8 Scorpion Swamp, etc.)

### Out of Scope

- User-defined custom book mechanics — built-in configs only; user-configurable extension is a future milestone
- Multiplayer or shared sessions — single-player companion only
- Rulebook content / story text — purely a mechanics tracker, not a digital edition
- Non-Fighting Fantasy systems — other gamebook series out of scope
- Freeway Fighter vehicle combat — deferred from v1.0 (requires bespoke combat system)

## Context

- FF combat: each round both sides roll 2d6 + Skill = Attack Strength; higher AS deals 2 Stamina damage to loser; ties = no damage; continue until 0 Stamina
- Test Your Luck: roll 2d6, ≤ current Luck = Lucky; Luck decreases by 1 regardless of outcome
- Book-specific mechanics extend the base sheet via config files; renderer reads config shape and builds UI dynamically
- Battle logs persist to the backend (`/api/sessions/{book}/actions`) so history survives device switches
- All mechanics state stored as open-ended JSON dict in `mechanics_json` column — supports arbitrary future field additions without schema migration

## Constraints

- **Tech stack**: Vanilla JS only (no frontend framework) — existing codebase constraint
- **No build step**: Files served as-is — keep all JS as native ES modules
- **Mobile-first**: UI must work well on phone screens for use alongside physical books
- **Single-player, server-backed**: All state persists to the backend; player can switch devices and resume any session

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Battle as modal overlay (not inline panel) | Cleaner adventure sheet; modal opens on "Start Battle" — Phase 6 | ✓ Good — container-scoped renderBattle() works with any container |
| Battle as panel on adventure sheet (not separate screen) | User preference — keeps context while fighting | Superseded by Phase 6 modal approach |
| Built-in book configs only (not user-configurable) | Simpler for v1; user-configurable is a future milestone | ✓ Good — configs are clean data files |
| Both live tracker + persistent round log for combat | User wants to review what happened after the fight | ✓ Good — logs persist via ActionLog backend |
| mechanics stored as TEXT JSON blob per session | Open-ended dict, no cross-session querying needed | ✓ Good — no schema migrations needed for new fields |
| name column added to Session model in Phase 1 | Avoids second DB recreate in Phase 2 | ✓ Good — saved a migration |
| drop_all in init_db() removed after Phase 1 | Development-time convenience, not safe for production | ✓ Removed as planned |
| Config registry uses lazy thunks | Prevents loading all book configs at startup | ✓ Good — dynamic imports work cleanly |
| ui/*.js modules receive state + callbacks as arguments | Prevents circular imports (D-17 pattern) | ✓ Good — consistent across all UI modules |
| storage.js only PUTs currentBook session | Simple; currentBook derived from updated_at ordering | ✓ Good — works for single-player use |
| Reuse combat_end action type (not new combat_flee) | Fewer action types to maintain | ✓ Good — winner differentiated in battle.js |
| splitRoll is cosmetic display only | 2d6 total from server is authoritative for game logic | ✓ Good — display and logic decoupled |
| Book 17 Clues: freeform list not predefined checklist | Clues are discovered and named in-game, not predetermined | ✓ Good — matches actual book mechanics |
| Book 30 Kuddam: named 7-enemy checklist | Enemies are specific named individuals to track | ✓ Good — matches actual book mechanics |
| Book 30 Tabasha: Skill/Luck picker + one-time restore | Tabasha restores chosen stat to initial; one invocation | ✓ Good — matches actual book mechanics |
| charCreate picker generalized for superpower + tabasha | Same UX pattern for any book requiring a char-create choice | ✓ Good — reusable for future books |
| onTabashaRestore callback on renderBookMechanics | Renderer signals app.js without importing it (D-17) | ✓ Good — maintains module boundary |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context and Current State

---
*Last updated: 2026-04-06 — Milestone v1.2 started: Defeat State*
