---
status: partial
phase: 03-battle-system
source: [03-VERIFICATION.md]
started: 2026-03-31T00:00:00.000Z
updated: 2026-03-31T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Complete combat lifecycle
expected: Enemy form accepts name/skill/stamina — Start Combat shows stamina bars — Roll Round produces a round card with die faces and outcome text — bars animate to new values — combat ends at 0 stamina with summary panel showing Victory/Defeated/Fled

result: [pending]

### 2. Flee Stamina deduction
expected: Clicking Flee triggers server-side -2 Stamina penalty, new value reflected in stat display, persists on page reload

result: [pending]

### 3. Combat history persistence
expected: After completing a combat, reloading the page shows the completed battle in the combat history log (collapsible panel, newest-first)

result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
