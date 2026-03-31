---
phase: 03-battle-system
plan: 03
subsystem: ui
tags: [html, battle, stamina-bars, combat, aria]

# Dependency graph
requires:
  - phase: 02-core-mechanics
    provides: existing combat section structure in index.html
provides:
  - Battle UI HTML scaffolding: stamina bars, round result card, post-battle summary, combat history section
affects:
  - 03-04-battle-js (battle.js queries these DOM IDs)
  - 03-05 (any additional battle UI enhancements)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ARIA progressbar role on stamina bar divs with aria-valuemin/max/now attributes"
    - "Hidden attribute on combat-summary — JS unhides on combat end"
    - "Separate combat-history-section outside combat-section for persistent log display"

key-files:
  created: []
  modified:
    - index.html

key-decisions:
  - "combat-enemy-stamina text paragraph removed; visual stamina bars replace it"
  - "combat-history-section placed between combat-section and actions-section"
  - "combat-summary div uses hidden attribute (not CSS class) to stay hidden until combat ends"

patterns-established:
  - "Battle DOM IDs follow prefix pattern: player-stamina-*, enemy-stamina-* for JS targeting"

requirements-completed:
  - BATTLE-03
  - BATTLE-04
  - BATTLE-06
  - BATTLE-07
  - BATTLE-08

# Metrics
duration: 1min
completed: 2026-03-31
---

# Phase 03 Plan 03: Battle UI HTML Scaffolding Summary

**HTML containers added to index.html: ARIA stamina bars for player and enemy, round result card div, hidden post-battle summary panel, and persistent Battle History section**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-31T00:27:35Z
- **Completed:** 2026-03-31T00:28:18Z
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments
- Added stamina bar group with ARIA progressbar roles for both player and enemy
- Added `#combat-round-result` div for round card injection by battle.js
- Added `#combat-summary` panel (starts hidden, battle.js unhides after combat ends)
- Added `#combat-history-section` with `#combat-history` container for persistent battle log
- Removed old `#combat-enemy-stamina` text paragraph (replaced by visual bars)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add battle UI elements to the combat section in index.html** - `302aaa1` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `index.html` - Added stamina bars, round result card, summary panel, battle history section

## Decisions Made
- `combat-enemy-stamina` text element removed; the stamina bar group is the canonical enemy stamina display going forward
- `combat-history-section` placed between `combat-section` and `actions-section` so battle log is visible below the active combat panel but above the sheet action buttons

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All DOM IDs required by battle.js (plan 03-04) are now present in index.html
- battle.js can `querySelector` any of: `#combat-stamina-bars`, `#player-stamina-bar`, `#player-stamina-fill`, `#player-stamina-value`, `#enemy-stamina-bar`, `#enemy-stamina-fill`, `#enemy-stamina-value`, `#enemy-stamina-label`, `#combat-round-result`, `#combat-summary`, `#combat-history`
- No CSS styles for the new elements yet — plan 03-04 or a CSS plan will need to style `stamina-bar`, `stamina-bar__fill`, `stamina-bar-row`, `stamina-bar-label`, `stamina-bar-value`, `stamina-bar-group`

---
*Phase: 03-battle-system*
*Completed: 2026-03-31*
