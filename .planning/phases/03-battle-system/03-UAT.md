---
status: complete
phase: 03-battle-system
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-03-31T00:00:00.000Z
updated: 2026-03-31T00:00:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Start fresh with uvicorn. Server boots without errors. http://localhost:3000 loads without console errors.
result: pass
note: drop_all bug found and fixed (660071f) — retested and confirmed

### 2. Start a combat
expected: The adventure sheet has a Combat section. Entering an enemy name, Skill value, and Stamina value then clicking Start Combat shows stamina bars for both player and enemy, and the Roll Round / Flee buttons become available.
result: pass

### 3. Roll a combat round
expected: Clicking Roll Round produces a round card showing individual die faces, both sides' Attack Strength, and a clear outcome (Hit / Missed / Both Hit). Stamina bars update with an animated transition to reflect damage. The round card replaces the previous one.
result: pass
note: outcome text is "Tied — no damage" (not "Both Hit") — correct FF rules behavior

### 4. Critical stamina pulse
expected: When either stamina bar drops to 25% or below, that bar pulses with a visual animation indicating critical health.
result: issue
reported: "pulsing only starts when stamina is below 25%, not when it is exactly at 25%"
severity: minor
fix: Changed < 25 to <= 25 in updateStaminaBars() for both bars — commit 264a083

### 5. Combat auto-ends at 0 stamina
expected: When enemy or player stamina reaches 0, combat ends automatically without needing to click anything. A post-battle summary panel appears.
result: pass

### 6. Post-battle summary panel
expected: After combat ends, a summary panel shows the outcome title (Victory / Defeated / Fled), how many rounds were fought, and final stamina values for both sides.
result: pass

### 7. Flee combat — stamina penalty
expected: Clicking Flee ends combat immediately. The player's Stamina stat on the adventure sheet decreases by 2 (server-applied). Reloading the page shows the reduced Stamina value persisted.
result: pass

### 8. Combat history persistence
expected: After completing a combat, a collapsible combat history section appears showing the completed battle. Reloading the page still shows the battle in the log (server-backed, not just in-memory).
result: issue
reported: "it doesn't collapse"
severity: minor
fix: Added .combat-log__battles[hidden] { display: none } — CSS display:flex was overriding hidden attribute — commit 9a68045
retest: pass (force reload required for CSS cache)

## Summary

total: 8
passed: 6
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps
