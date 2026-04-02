---
phase: 04-book-configs
plan: 03
subsystem: ui
tags: [vanilla-js, es-modules, app-wiring, book-mechanics, index-html, superpower, persistence]

# Dependency graph
requires:
  - phase: 04-01
    provides: book config files (book-17.js, book-30.js), CSS classes, registry activation
  - phase: 04-02
    provides: renderBookMechanics() renderer module, charCreate.js superpower picker with 4-param onComplete

provides:
  - index.html with #book-mechanics-section placeholder between stats and tests sections
  - app.js with full book mechanics wiring: imports, renderBookMechanicsSection(), superpower persistence

affects: [end-to-end Book 17 and Book 30 mechanics visible on adventure sheet]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "renderBookMechanicsSection() async helper: getBookConfig() + hasMechanicsContent guard + show/hide"
    - "render() is now async — all callers in async context use await; syncStateFromServer is fire-and-forget"
    - "superpower stored immediately in mechanics.superpower when truthy; mechanics starts empty when null"
    - "onMechanicsChange callback pattern: updates state.mechanics, games[currentBook], calls save()"

key-files:
  created: []
  modified:
    - index.html
    - js/app.js

key-decisions:
  - "render() made async to support await getBookConfig() inside renderBookMechanicsSection()"
  - "syncStateFromServer calls render() without await (fire-and-forget) — caller does not need to wait; save() called separately"
  - "hasContent check includes superpower conditional: both bookConfig.superpower AND state.mechanics.superpower must be truthy to show section for superpower-only content"

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 4 Plan 03: Integration Wiring — index.html and app.js

**Full end-to-end wiring: book-mechanics-section in HTML, renderBookMechanics import and call in app.js, superpower persistence, mechanics save/load**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-02T03:00:00Z
- **Completed:** 2026-04-02T03:05:00Z
- **Tasks:** 1 of 2 (Task 2 is a human-verify checkpoint — awaiting)
- **Files modified:** 2

## Accomplishments

- Added `<section class="mechanics-section book-mechanics-section" id="book-mechanics-section" hidden>` to index.html between `.stats-section` and `.tests-section`
- Added imports for `renderBookMechanics` and `getBookConfig` to app.js
- Added `renderBookMechanicsSection()` async helper that: gets book config, checks for content, hides section when empty, calls `renderBookMechanics()` with state and save callback
- Updated `render()` to be async and call `await renderBookMechanicsSection()`
- Updated `_applyNewCharacter()` to accept `superpower` 4th param; stores `{ superpower }` in mechanics when truthy
- Updated both `onComplete` handlers (in `init()` and `bindEvents()`) to pass `superpower` through to `_applyNewCharacter()`
- Updated `init()` and `selectBook()` to `await render()`; `syncStateFromServer` left as fire-and-forget per plan spec

## Task Commits

1. **Task 1: Wire book-mechanics-section into index.html and app.js** - `b8f6866` (feat)

## Files Created/Modified

- `index.html` — Added `#book-mechanics-section` placeholder section between stats and tests sections (hidden by default)
- `js/app.js` — Added imports, renderBookMechanicsSection(), async render(), superpower 4th param wiring in _applyNewCharacter and both onComplete handlers

## Decisions Made

- `render()` made async to support `await getBookConfig()` inside `renderBookMechanicsSection()` without blocking the initial synchronous setup
- `syncStateFromServer` uses fire-and-forget `render()` call — the state sync path doesn't need to wait for async book config resolution since the save() is called independently
- `hasContent` check for superpower requires both `bookConfig.superpower` (config has it) AND `state.mechanics.superpower` (player selected it) — prevents empty section if player somehow has a config book without having chosen a superpower

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan is pure wiring code with no placeholder data. Config file stubs (Clue 1-8, Spell 1-6, Ability 1-4) from Plan 01 are inherited but not introduced here.

## Issues Encountered

None.

## Checkpoint Status

Stopped at Task 2 (human-verify checkpoint) — awaiting human verification of end-to-end Book 17 and Book 30 mechanics.

---
*Phase: 04-book-configs*
*Completed: 2026-04-02*
