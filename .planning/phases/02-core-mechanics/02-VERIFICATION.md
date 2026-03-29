---
phase: 02-core-mechanics
verified: 2026-03-29T12:00:00Z
status: human_needed
score: 10/10 requirements verified
re_verification: true
  previous_status: gaps_found
  previous_score: 8/10
  gaps_closed:
    - "Character name is persisted to the backend — storage.js save() now includes name: game.name ?? null in PUT body (line 36)"
    - "Character name is restored on page load — storage.js load() now maps name: s.name ?? null into games object (line 65)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Dice animation plays during character creation"
    expected: "Each .die-face cycles random values for ~600ms then snaps to final roll value"
    why_human: "Animation timing and visual cycling cannot be verified by static code inspection"
  - test: "Roll button becomes disabled after first roll"
    expected: "Button is visually greyed out and non-interactive after the first click; Confirm becomes enabled"
    why_human: "Requires browser interaction to confirm disabled state renders correctly"
  - test: "Lucky/Unlucky label colour distinction"
    expected: "Lucky shows in accent-red, Unlucky in normal ink weight"
    why_human: "CSS variables require rendered output to confirm correct colour application"
---

# Phase 2: Core Mechanics Verification Report

**Phase Goal:** Users can start a new character with proper FF stat generation, test their luck with a clear result, and roll dice at any time.
**Verified:** 2026-03-29
**Status:** HUMAN NEEDED (all automated checks pass; 3 visual/interaction items remain)
**Re-verification:** Yes — after gap closure in js/storage.js

---

## Re-verification Summary

Two gaps from the initial verification were fixed:

**Gap 1 — CLOSED:** `js/storage.js` save() now includes `name: game.name ?? null` at line 36 of the PUT body sent to `/api/sessions/{book_number}`. Confirmed present.

**Gap 2 — CLOSED:** `js/storage.js` load() forEach now maps `name: s.name ?? null` at line 65 into the games reconstruction. Confirmed present.

No regressions detected in previously passing items.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Character creation flow opens with book selection, dice roll, name input, and confirm | VERIFIED | charCreate.js showCharCreate() builds all three steps in a single modal |
| 2 | Individual die values animate and are shown per stat | VERIFIED | animateDieFace() called per die; .die-face elements for skill, stamina x2, luck (lines 275-278) |
| 3 | Stats follow FF rules: skill=1d6+6, stamina=2d6+12, luck=1d6+6 | VERIFIED | charCreate.js lines 237-244: individual roll(6) calls with correct bonuses |
| 4 | Book must be selected before stats can be confirmed | VERIFIED | Confirm handler validates !selectedBook (line 286) and sets error text |
| 5 | Book-specific mechanics note shows when a configured book is selected | VERIFIED | getBookConfigNote() checks CONFIG_REGISTRY; display path wired (fires in Phase 4) |
| 6 | Test Luck shows Lucky/Unlucky with two die values and decrements Luck by 1 | VERIFIED | test-luck handler (app.js lines 402-446): .die-face x2, lucky/unlucky label, luckAfter footnote |
| 7 | Luck decrement reaches the backend | VERIFIED | testLuck() POSTs luck_test action; actions.py applies luck_current - 1 server-side |
| 8 | Standalone dice roller is present with d6 and 2d6 showing individual die faces | VERIFIED | renderDiceRoller called in init() (app.js line 67); diceRoller.js renders separate .die-face elements |
| 9 | Character name is persisted to backend | VERIFIED | storage.js save() line 36: name: game.name ?? null now present in PUT body |
| 10 | Character name is restored after page reload | VERIFIED | storage.js load() line 65: name: s.name ?? null now mapped in forEach loop |

**Score:** 10/10 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `js/ui/charCreate.js` | Character creation modal | VERIFIED | 337 lines; book search, dice roll, name input, confirm — all present |
| `js/ui/diceRoller.js` | Standalone dice widget | VERIFIED | 52 lines; d6 and 2d6 buttons, separate .die-face renders |
| `js/app.js` | Wiring, luck handler, renderCharName | VERIFIED | All three present: imports both UI modules, test-luck handler at line 402, renderCharName at line 228 |
| `index.html` | #char-name, #luck-result, #dice-section | VERIFIED | All three elements present at lines 14, 69, 72 |
| `css/style.css` | .die-face, .luck-result__*, .char-name | VERIFIED | All classes defined at lines 609, 693, 729-791 |
| `backend/schemas.py` | name field in SessionCreate/Response/Update | VERIFIED | name: str | None = None present at lines 22, 45, 57 |
| `backend/routers/sessions.py` | name written in upsert and patch | VERIFIED | upsert (lines 65, 70) and patch (lines 101-102) both write body.name |
| `js/storage.js` | name in save() PUT body and load() games map | VERIFIED | save() line 36 confirmed; load() line 65 confirmed |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app.js` | `charCreate.js` | import + showCharCreate() call | WIRED | Lines 10, 55, 314 |
| `app.js` | `diceRoller.js` | import + renderDiceRoller() call | WIRED | Lines 11, 67 |
| `charCreate.js` | `dice.js` | import roll() | WIRED | Line 14, used at lines 237-240 |
| `diceRoller.js` | `dice.js` | import roll() | WIRED | Line 10, used at lines 34, 41-42 |
| `app.js` test-luck handler | `mechanics.js` testLuck() | import + call | WIRED | Lines 8, 413 |
| `mechanics.js` testLuck()` | `/api/sessions/{book}/actions` | fetch POST | WIRED | Confirmed previously |
| `/api/sessions/{book}/actions` | DB luck_current decrement | actions.py | WIRED | luck_current - 1 applied server-side |
| `_applyNewCharacter()` | `state.name` | sets games[bookNumber].name | WIRED | Line 270 |
| `storage.js save()` | name field | PUT body to /api/sessions | WIRED | Line 36: name: game.name ?? null (gap now closed) |
| `storage.js load()` | name field | games reconstruction | WIRED | Line 65: name: s.name ?? null (gap now closed) |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `renderCharName()` in app.js | `state.name` | _applyNewCharacter() sets it; load() now restores it from server | Yes — save() sends it to backend; load() reads it back | FLOWING |
| `#luck-result` element | d1, d2, r.success, r.luckAfter | roll(6) locally; testLuck() POST to backend | Backend applies real decrement; response includes updated session | FLOWING |
| `#dice-roller-result` | value, d1, d2 | roll(6) calls directly | Real random values | FLOWING |
| Stat displays after char create | state.skill/stamina/luck | _applyNewCharacter() from charCreate confirm | Real dice rolls from charCreate.js | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — requires running server to test API endpoints. No static entry point to exercise luck decrement or character save without uvicorn running.

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| CHAR-01 | Individual die values visible during creation | VERIFIED | animateDieFace() per die; .die-face elements rendered |
| CHAR-02 | Book selected before stats confirmed | VERIFIED | Validation at charCreate.js line 286 |
| CHAR-03 | Optional name field; name passed to backend | VERIFIED | Name input exists; _applyNewCharacter passes name; storage.js save() includes it; load() restores it |
| CHAR-04 | FF stat rules: skill=d+6, stamina=d+d+12, luck=d+6 | VERIFIED | charCreate.js lines 237-244 |
| CHAR-05 | Book-specific mechanics note activates | VERIFIED | getBookConfigNote() wired; fires when CONFIG_REGISTRY has an entry |
| LUCK-01 | Test Luck button exists with handler | VERIFIED | #test-luck handler in app.js line 402 |
| LUCK-02 | Lucky/Unlucky with dice shown | VERIFIED | .die-face x2, luck-result__label--lucky/--unlucky rendered |
| LUCK-03 | Luck decrements by exactly 1 | VERIFIED | Backend actions.py applies decrement atomically; luckAfter shown in footnote |
| DICE-01 | Standalone widget present | VERIFIED | renderDiceRoller() called in init(), #dice-section in HTML |
| DICE-02 | Individual die values for 2d6 | VERIFIED | diceRoller.js lines 41-50 render two separate .die-face elements |

**All 10 requirements satisfied.**

---

## Anti-Patterns Found

None. The two storage.js blockers from the initial verification have been resolved. No TODO/FIXME/placeholder comments found in Phase 2 files. No stubs or hollow props detected.

---

## Human Verification Required

### 1. Die Animation

**Test:** Open the app, click "New Adventure", then click "Roll!"
**Expected:** Each .die-face visibly cycles through random numbers for ~600ms before settling on the final value; all four dice animate simultaneously
**Why human:** CSS/JS animation timing and visual state cycling cannot be confirmed by static analysis

### 2. Roll Button Disables After First Roll

**Test:** In the character creation modal, click "Roll!" once
**Expected:** The Roll button becomes greyed out and unclickable; the Confirm button becomes enabled after all animations complete
**Why human:** Disabled state rendering and the animation-completion gate require browser interaction to verify

### 3. Lucky/Unlucky Colour Contrast

**Test:** Test Luck several times to see both outcomes
**Expected:** "Lucky!" renders in the accent red colour; "Unlucky." renders in normal ink weight and colour
**Why human:** CSS variable resolution (--accent-red) requires rendered output to confirm

---

## Gaps Summary

No gaps remain. Both storage.js gaps identified in the initial verification have been closed:

- `save()` now sends `name: game.name ?? null` in every PUT to `/api/sessions/{book_number}`
- `load()` now maps `name: s.name ?? null` from every session returned by `/api/sessions`

The complete name persistence round-trip is now wired: character creation -> _applyNewCharacter -> state.name -> save() PUT -> backend ORM -> load() forEach -> state.name -> renderCharName().

All 10 observable truths verified. All 10 requirements satisfied. Phase 2 goal is achieved.

---

_Verified: 2026-03-29_
_Verifier: Claude (gsd-verifier)_
