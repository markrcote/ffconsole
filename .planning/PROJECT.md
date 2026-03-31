# FF Console

## What This Is

A web-based companion app for Fighting Fantasy gamebooks by Steve Jackson and Ian Livingstone. It handles the mechanics so you can focus on the adventure: character creation, combat, luck tests, dice rolls, and book-specific mechanics for individual titles.

## Core Value

Complete, accurate mechanical support for playing Fighting Fantasy — the app should never be the bottleneck when you need to resolve a combat, test your luck, or roll some dice.

## Requirements

### Validated

- ✓ Character stats tracking (Skill, Stamina, Luck with initial/current values) — existing
- ✓ Stat adjustment (+/- buttons, long-press for bonus above initial) — existing
- ✓ Dice rolling utilities (rollInitialStats per FF rules) — existing
- ✓ State persistence (FastAPI backend + localStorage fallback) — existing
- ✓ Action/event logging infrastructure (ActionLog model, /api/sessions/{book}/actions) — existing
- ✓ Book catalog (books.js with FF book search) — existing
- ✓ Basic mechanic/combat styles in UI — existing

### Active

- ✓ Character creation flow: roll stats (Skill 1d6+6, Stamina 2d6+12, Luck 1d6+6) with visible dice, name entry, book selection — Validated in Phase 2: Core Mechanics
- ✓ Test Your Luck: roll 2d6 ≤ current Luck = Lucky, Luck -1 either way, clear result display — Validated in Phase 2: Core Mechanics
- ✓ Dice roller: standalone roll any combination (1d6, 2d6, etc.) with result shown — Validated in Phase 2: Core Mechanics
- ✓ Battle system: panel on adventure sheet, enter enemy name/Skill/Stamina, conduct combat round-by-round with roll buttons, live Stamina tracker for both sides, persistent round-by-round log, post-battle summary — Validated in Phase 3: Battle System
- [ ] Book-specific mechanics: built-in configs for specific FF titles that extend the base sheet with extra stats, resources, and combat types (starting with Appointment with F.E.A.R., Chasms of Malice, Freeway Fighter)

### Out of Scope

- User-defined custom book mechanics — built-in configs only for now; user-configurable extension is a future milestone
- Multiplayer or shared sessions — single-player companion only
- Rulebook content / story text — purely a mechanics tracker, not a digital edition of the books
- Non-Fighting Fantasy systems — other gamebook series are out of scope

## Context

- The existing app already has the stats sheet, persistence layer, and some partial combat/test UI
- FF combat rules: each round both sides roll 2d6 + Skill = Attack Strength; higher AS wins and deals 2 Stamina damage to loser; ties mean no damage; continue until one side reaches 0 Stamina
- Test Your Luck: roll 2d6, if ≤ current Luck you are Lucky; Luck decreases by 1 regardless of outcome
- Book-specific mechanics vary widely: some books add simple numeric stats (Hero Points, Kuddam defeats), some add resource trackers (fuel, provisions, spells), some add entirely different combat systems (vehicle combat, shooting)
- Stack: vanilla JS ES modules frontend, FastAPI/SQLite backend, no build step

## Constraints

- **Tech stack**: Vanilla JS only (no frontend framework) — existing codebase constraint
- **No build step**: Files served as-is — keep all JS as native ES modules
- **Mobile-first**: UI must work well on phone screens for use alongside physical books
- **Single-player, server-backed**: All state persists to the backend; player can switch devices and resume any session

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Battle as panel on adventure sheet (not separate screen) | User preference — keeps context while fighting | — Pending |
| Built-in book configs only (not user-configurable) | Simpler for v1; user-configurable is a future milestone | — Pending |
| Both live tracker + persistent round log for combat | User wants to review what happened after the fight | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 — Phase 03 complete: full battle system — enemy entry, round resolution, stamina bars, flee penalty, combat history log*
