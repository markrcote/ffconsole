---
status: complete
phase: 02-core-mechanics
source: [02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md]
started: 2026-03-29T19:50:00Z
updated: 2026-03-29T19:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. First-load — character creation modal opens
expected: Open the app with no existing session. Character creation modal appears automatically (not the old book picker).
result: issue
reported: "seeing what looks to be a game in progress"
severity: major

### 2. Character creation — book search and selection
expected: Modal shows a book search field. Typing filters the book list. Selecting a book shows its name.
result: pass
notes: required CSS fix for .book-item.selected (missing style — fixed inline)

### 3. Character creation — Roll! button and die faces
expected: Clicking "Roll!" shows 4 individual die face bubbles (Skill d6, Stamina d6×2, Luck d6) each cycling through values before landing on a result. The Roll! button becomes disabled after the first click.
result: pass

### 4. Character creation — name input and confirm
expected: After rolling, a name field is available (optional). Clicking Confirm closes the modal and shows the adventure sheet with the rolled stats.
result: pass

### 5. Character name persists on reload
expected: If a name was entered, it appears below the book title in the header. Reload the page — the name is still shown.
result: pass

### 6. Character name hidden when blank
expected: If no name was entered, there's no empty space or placeholder below the book title — the line is absent entirely.
result: pass

### 7. Overwrite warning for existing session
expected: With a session already active, clicking "New Adventure" and selecting the same book shows a warning ("this will replace...") before allowing confirm.
result: pass

### 8. Test Your Luck — die faces and result
expected: Clicking "Test Luck" shows two die-face bubbles and a clear "Lucky!" or "Unlucky." label below them.
result: pass

### 9. Test Your Luck — Luck stat decrements
expected: After the luck test, the current Luck value on the adventure sheet drops by exactly 1.
result: pass

### 10. Dice roller — Roll d6
expected: A "Dice" section is visible on the page with a "Roll d6" button. Clicking it shows a single die face with a value 1–6.
result: pass

### 11. Dice roller — Roll 2d6
expected: Clicking "Roll 2d6" shows two separate die face bubbles and a total (e.g., "4 + 3 = 7").
result: pass

## Summary

total: 11
passed: 10
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Opening the app with no backend sessions shows the character creation modal immediately"
  status: failed
  reason: "User reported: seeing what looks to be a game in progress (stale localStorage overriding empty backend)"
  severity: major
  test: 1
  root_cause: "load() falls back to localStorage when backend returns [], so old cached state overrides empty backend"
  artifacts:
    - path: "js/storage.js"
      issue: "load() should skip localStorage fallback when backend responds with empty array"
  missing:
    - "In load(): if backend responds OK with [], do not fall through to localStorage — return null to trigger char creation"
  debug_session: ""
