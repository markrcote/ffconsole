---
phase: 04-book-configs
plan: 01
subsystem: ui
tags: [vanilla-js, config, css, fighting-fantasy, book-17, book-30]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: config registry pattern (CONFIG_REGISTRY), getBookConfig() loader, default.js base shape
  - phase: 02-core-mechanics
    provides: mechanics-section CSS patterns, style.css design system
provides:
  - js/config/mechanics/book-17.js with Hero Points, Clues checklist, and 5 superpower options
  - js/config/mechanics/book-30.js with Kuddam/Tabasha extraStats, Provisions/Fuel resources, Spells/Special Abilities checklists
  - Extended default.js schema with checklists array
  - Activated registry entries for books 17 and 30 via dynamic import thunks
  - CSS classes for checklist groups, checklist items, superpower picker, and superpower read-only display
affects: [04-02-PLAN, 04-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Book config files export const config = { ... } following existing default.js pattern"
    - "checklists array in config schema: Array<{ id, label, items: Array<{ id, label }> }>"
    - "superpower key present only on books that require it (not in default config)"

key-files:
  created:
    - js/config/mechanics/book-17.js
    - js/config/mechanics/book-30.js
  modified:
    - js/config/mechanics/default.js
    - js/config/mechanics/registry.js
    - css/style.css

key-decisions:
  - "Clue names for Book 17 use numbered placeholders (Clue 1-8) — exact names not confirmable without book access"
  - "Spell and Special Ability names for Book 30 use numbered placeholders — exact names not confirmable without book access"
  - "superpower key is absent from default.js config object; only book configs with superpower options define it"
  - "checklists: [] added to default.js so renderer code can iterate safely without null checks"

patterns-established:
  - "Book-specific CSS follows existing .mechanics-section convention — no new design language"
  - ".checklist-item.checked label uses text-decoration: line-through to indicate completion"

requirements-completed: [AFEAR-01, AFEAR-02, AFEAR-03, CHAOS-01, CHAOS-02, CHAOS-03, CHAOS-04, CHAOS-05]

# Metrics
duration: 8min
completed: 2026-04-02
---

# Phase 4 Plan 01: Book Config Files, Schema Extension, and Checklist/Superpower CSS

**Config data layer for Books 17 and 30 — extraStats, checklists, superpower, resources — plus all CSS classes needed for the book mechanics renderer**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-02T00:00:00Z
- **Completed:** 2026-04-02T00:08:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created book-17.js with Hero Points extraStat, 8-item Clues checklist, and 5 superpower options (Psi-Powers, Energy Blast, Flying, Super Strength, Laser Vision)
- Created book-30.js with Kuddam/Tabasha extraStats, Provisions/Fuel resources, and Spells/Special Abilities checklists
- Extended default.js config schema with `checklists: []` and updated JSDoc to document the full schema including the optional `superpower` key
- Activated both CONFIG_REGISTRY entries in registry.js by uncommenting the dynamic import thunks (D-03)
- Added all Phase 4 CSS classes to style.css: checklist group/items/labels/checked states, superpower picker, superpower read-only display

## Task Commits

Each task was committed atomically:

1. **Task 1: Create book config files, extend default schema, activate registry** - `7085788` (feat)
2. **Task 2: Add CSS classes for checklist items, superpower picker, and superpower display** - `890ce19` (feat)

## Files Created/Modified

- `js/config/mechanics/book-17.js` - Book 17 config: Hero Points extraStat, Clues checklist (8 items), superpower options
- `js/config/mechanics/book-30.js` - Book 30 config: Kuddam/Tabasha extraStats, Provisions/Fuel resources, Spells/Special Abilities checklists
- `js/config/mechanics/default.js` - Added `checklists: []` to config object, updated JSDoc with full schema
- `js/config/mechanics/registry.js` - Uncommented entries for books 17 and 30 to activate dynamic import thunks
- `css/style.css` - Added Phase 4 Book Mechanics section with all checklist and superpower CSS classes

## Decisions Made

- Clue names for Book 17 use numbered placeholders ("Clue 1" through "Clue 8") — exact canonical names from the book could not be confirmed without access to the physical book. Future update can replace with real names.
- Spell names and Special Ability names for Book 30 also use numbered placeholders for the same reason — Chasms of Malice spell list not confirmable from available context.
- `superpower` key is intentionally absent from default.js config object (only present on book configs that define it). This means code accessing `config.superpower` must check for its presence — this is the correct pattern per D-08.
- `checklists: []` is present in default.js so that renderer code can safely iterate `config.checklists` without null checks on unsupported books.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `js/config/mechanics/book-17.js` lines 21-28: Clue items use labels "Clue 1" through "Clue 8". The exact clue names from Appointment with F.E.A.R. are not confirmed. These stubs render correctly in the UI as placeholder text — the tracker is fully functional, just using generic labels. A future update can replace with canon names.
- `js/config/mechanics/book-30.js` lines 25-30: Spell items use labels "Spell 1" through "Spell 6". Exact spell names from Chasms of Malice not confirmed.
- `js/config/mechanics/book-30.js` lines 33-38: Special Ability items use labels "Ability 1" through "Ability 4". Exact ability names from Chasms of Malice not confirmed.

These stubs do NOT prevent the plan's goal from being achieved — the config data layer is fully functional with correct structure. The placeholder labels are aesthetic only.

## Issues Encountered

None.

## Next Phase Readiness

- Config data layer complete; Plan 02 (bookMechanics.js renderer) can now import and use getBookConfig() to render extraStats, resources, checklists, and superpower display
- CSS classes are in place for renderer to generate DOM with correct class names
- Registry activated — getBookConfig(17) and getBookConfig(30) both resolve via dynamic import

---
*Phase: 04-book-configs*
*Completed: 2026-04-02*
