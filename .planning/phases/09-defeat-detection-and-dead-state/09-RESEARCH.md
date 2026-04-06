# Phase 9: Defeat Detection and Dead State — Research

**Researched:** 2026-04-06
**Domain:** Vanilla JS app-state management, CSS/HTML section toggling, FastAPI PATCH endpoint, browser setTimeout API
**Confidence:** HIGH — all findings verified directly from the codebase; no external library research required

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Dead status persistence:** Store as `{ ..., dead: true }` inside the existing `mechanics_json` blob. No DB migration. Uses the existing PATCH endpoint.
2. **Dead state visual:** A top-level `<section id="dead-state">` in `index.html`, hidden by default via `hidden` attribute toggle. NOT `.modal-overlay`. Shows read-only stats (Skill/Stamina/Luck) + Restart + Change Book buttons.
3. **Undo window:** ~5 seconds auto-dismiss with a toast/button shown immediately when Stamina hits 0 via sheet buttons. Dead state commits and saves only after the window expires or user dismisses it. No Undo for the manual defeat path.
4. **Manual defeat button:** "I'm Dead" button on the sheet (placement: planner decides). No Undo. Same dead state overlay and recovery actions as automatic defeat. Files: `js/ui/stats.js` and `js/app.js`.
5. **Combat defeat signal:** Add `defeated: true` flag to the combat result returned by `rollCombatRound()` (or the combat flow in `battle.js`) when player Stamina hits 0. Phase 10 hooks into this signal; Phase 9 only provides the detection.

### Claude's Discretion

- Placement of the "I'm Dead" button on the sheet.
- Visual design of the Undo toast (countdown indicator vs. simple timeout).
- Exact CSS implementation of the dead-state overlay's stat display (read-only layout).

### Deferred Ideas (OUT OF SCOPE)

- Multi-step undo (undo history)
- "New Battle" inside modal without closing
- Session archiving / graveyard
- Recovery actions (Restart, Change Book) — these are Phase 11
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEFEAT-01 | App automatically detects defeat when player Stamina reaches 0 during combat | `rollCombatRound()` return value — add `defeated` flag; `battle.js` already checks `playerStamina <= 0` at line 409 |
| DEFEAT-02 | App automatically detects defeat when player Stamina is reduced to 0 via sheet stat buttons | `modifyStat()` in `app.js:218` — intercept `newValue === 0 && name === 'stamina'` |
| DEFEAT-05 | When Stamina hits 0 via sheet buttons, sheet immediately shows dead state | `#dead-state` section show/hide via `hidden` attribute; disable all stat +/- buttons |
| DEFEAT-06 | Sheet-triggered dead state includes an Undo action to reverse the Stamina change | `setTimeout` + stored previous value in `modifyStat()`; Undo toast DOM element |
| DEFEAT-07 | Dead state is visually unambiguous | New `#dead-state` section with "YOU ARE DEAD" heading; read-only stat display; no +/- buttons |
</phase_requirements>

---

## Summary

Phase 9 is a pure codebase extension — no new libraries, no backend migration, no new routes. All infrastructure already exists: `mechanics_json` is the established extension point for session-level state, the PATCH endpoint handles partial updates, `hidden`-attribute toggling is the established section show/hide pattern, and `modifyStat()` is the single choke-point for all sheet stat changes.

The three distinct code paths are: (1) stamina-0 via sheet buttons → `modifyStat()` → Undo toast → dead state; (2) manual "I'm Dead" button → dead state immediately; and (3) stamina-0 during combat → `defeated` flag in `rollCombatRound()` return value → Phase 10 hooks in later.

**Primary recommendation:** All three paths converge on a shared `enterDeadState()` function in `app.js` that writes `state.mechanics.dead = true`, saves to backend via `save()`, shows `#dead-state` section, and hides the normal sheet content. The Undo window is a local `setTimeout` in `modifyStat()` that delays calling `enterDeadState()`.

---

## Standard Stack

No new dependencies. Everything required is already present.

| Capability | Implementation | Source |
|------------|---------------|--------|
| Timed Undo window | Browser `setTimeout` / `clearTimeout` | Native — no library |
| Dead state persistence | `PATCH /api/sessions/{book}` with `{ mechanics: { ...current, dead: true } }` | Existing endpoint |
| Section show/hide | `element.hidden = true/false` | Existing HTML pattern |
| Stat re-render disabled | `renderStat(name, state)` sets `btn.disabled` when `stat.current <= 0` | Existing `ui/stats.js` |
| State save | `save({ games, currentBook })` | Existing `storage.js` |

**Installation:** None required.

---

## Architecture Patterns

### How `modifyStat()` Works (app.js:218)

[VERIFIED: read js/app.js]

```js
async function modifyStat(name, delta, allowBonus = false) {
    const stat = state[name];
    if (!stat) return;

    const newValue = stat.current + delta;

    if (newValue < 0) return;                                    // floor at 0, not below

    if (delta > 0 && stat.current >= stat.initial && !allowBonus) {
        return;                                                  // cap at initial unless bonus mode
    }

    stat.current = newValue;
    games[currentBook] = state;
    await save({ games, currentBook });
    renderStat(name, state);
}
```

**Hook point:** After `newValue` is computed but before `stat.current = newValue` is committed. When `name === 'stamina' && newValue === 0`, intercept to trigger Undo window instead of immediately committing.

**Note:** `newValue < 0` returns early, so stamina=0 is a valid reachable case (delta=-1, current=1 → newValue=0).

### How `mechanics_json` Is Read and Written

[VERIFIED: read backend/schemas.py, backend/routers/sessions.py, js/storage.js]

**Write path (JS):**
- `storage.js save()` calls `PUT /api/sessions/{book}` with body containing `mechanics: game.mechanics ?? {}`
- `game.mechanics` is the in-memory `state.mechanics` object (`{}` by default)
- Setting `state.mechanics.dead = true` then calling `save()` writes `{ dead: true }` into `mechanics_json`

**Read path (JS):**
- `storage.js load()` fetches `GET /api/sessions` → backend returns `SessionResponse` with `mechanics` dict
- `games[s.book_number].mechanics = s.mechanics ?? {}`
- On startup: `state = games[currentBook]` → `state.mechanics.dead` is the persisted dead flag

**Backend deserialization (Python):**
```python
# schemas.py SessionResponse.assemble_stat_blocks()
"mechanics": json.loads(data.mechanics_json or '{}'),
```

**PATCH endpoint (for mechanics-only update):**
```python
# backend/routers/sessions.py patch_session()
if body.mechanics is not None:
    session.mechanics_json = json.dumps(body.mechanics)
```
The PATCH endpoint is available but `storage.js save()` uses PUT (upsert). For dead state, using the existing `save()` call (which does a full PUT) is sufficient and simpler — no need to use PATCH separately. The PUT endpoint overwrites `mechanics_json` with the entire mechanics object, which is correct since we hold the full `state.mechanics` in memory.

### Section Show/Hide Pattern

[VERIFIED: read index.html, js/app.js:250-292]

The established pattern uses the HTML `hidden` attribute:

```js
// js/app.js renderBookMechanicsSection()
container.hidden = true;   // hide
container.hidden = false;  // show
```

In `index.html`, sections use `hidden` as a boolean attribute:
```html
<section class="mechanics-section book-mechanics-section" id="book-mechanics-section" hidden>
```

The `#dead-state` section should follow this exact pattern — placed in `index.html` with `hidden` attribute by default, shown by setting `element.hidden = false`.

**Note:** `.modal-overlay` uses `display:none` toggled via `classList.add('active')` (CSS sets `.modal-overlay.active { display: flex }`). The context decision explicitly rejects this pattern for dead state — use `hidden` attribute instead.

### Existing DOM Structure in index.html

[VERIFIED: read index.html]

The `<main class="adventure-sheet">` element contains all visible sections in sequence:
1. `<header class="sheet-header">` — book title, char name
2. `<section class="stats-section">` — skill/stamina/luck rows with +/- buttons
3. `<section class="mechanics-section actions-section">` — Test Luck, Start Battle
4. `<section class="mechanics-section dice-section" id="dice-section">`
5. `<section class="mechanics-section book-mechanics-section" id="book-mechanics-section" hidden>`
6. `<section class="mechanics-section combat-history-section" id="combat-history-section">`
7. `<section class="actions-section">` — Switch Book, New Adventure buttons

The new `#dead-state` section should be inserted at the top of `<main>` (or at the `<body>` level) so it covers/replaces the sheet visually. Given the CONTEXT.md spec ("adventure sheet is replaced"), placing it as the first child of `<main class="adventure-sheet">` and showing it while hiding other sections is the implementation approach.

### Stat Button Disable Pattern

[VERIFIED: read js/ui/stats.js]

`renderStat(name, state)` in `ui/stats.js` already manages button disabled state:

```js
if (decreaseBtn) decreaseBtn.disabled = stat.current <= 0;

if (increaseBtn) {
    increaseBtn.disabled = false;
    increaseBtn.classList.toggle('locked', stat.current >= stat.initial);
}
```

For dead state, the planner has two options:
1. Add a `disabled` prop to `renderStat()` that forces all buttons disabled regardless of stat value.
2. Directly set `disabled` on buttons via DOM after `renderStat()` calls (simpler but less clean).

Option 1 is cleaner and aligns with the D-17 pattern (state + callbacks flow in). A `options = {}` third argument to `renderStat()` with an optional `disabled: true` flag would not break existing callers.

### Combat Defeat Hook Point

[VERIFIED: read js/ui/battle.js, js/mechanics.js]

`rollCombatRound()` in `mechanics.js` currently returns:
```js
return {
    playerRoll, enemyRoll, playerAttack, enemyAttack,
    result: combatResult, enemyStaminaAfter,
    session: result?.session ?? null,
};
```

The `playerStamina` check happens in `battle.js` after the round resolves:
```js
// battle.js line 409
if (playerStamina <= 0 || enemy.stamina <= 0) {
    const winner = enemy.stamina <= 0 ? 'player' : 'enemy';
    await callbacks.onEnd(...);
    endCombatUI(winner, playerStamina);
    callbacks.onCombatEnd();
    return;
}
```

The `defeated` signal can be added in one of two places:
- **Option A:** In `battle.js`, add `defeated: true` to the data passed into `endCombatUI()` when `winner === 'enemy'`, and propagate via a new `onDefeat` callback.
- **Option B:** In `battle.js`, emit the signal directly via a callback (e.g., `callbacks.onPlayerDefeated?.()`) when `playerStamina <= 0`.

Option B is cleaner for Phase 10 hookup. The callback can be a no-op in Phase 9 (Phase 10 implements the actual modal defeat screen). This avoids coupling the `endCombatUI` function to dead-state logic.

### The PATCH Endpoint — Confirmed Available

[VERIFIED: read backend/routers/sessions.py:86-107]

```python
@router.patch("/sessions/{book_number}", response_model=SessionResponse)
def patch_session(book_number: int, body: SessionUpdate, db: DBSession = Depends(get_db)):
    # ...
    if body.mechanics is not None:
        session.mechanics_json = json.dumps(body.mechanics)
    # ...
```

`SessionUpdate` has all fields optional. A mechanics-only patch sends:
```json
{ "mechanics": { "dead": true, "...other": "fields" } }
```

However, as noted above, the existing `save()` function already handles this via PUT, which is equally correct. No new PATCH call needed for Phase 9 unless a lighter-weight save is desired.

### Undo Toast Pattern

[VERIFIED: read css/style.css — no existing toast component]

No toast/snackbar component exists in the codebase. The Undo window is new UI. The planner should implement a simple inline element (not a fixed-position toast) — an element injected into the sheet that auto-removes after ~5 seconds. Given the mobile-first constraint and `.mechanic-btn` existing styles, the Undo button can use the existing button classes.

Pattern for timed Undo in `modifyStat()`:
```js
// Store previous value
const prevValue = stat.current;
// Apply change tentatively to show visual feedback (stat=0 shown)
stat.current = newValue;
games[currentBook] = state;
renderStat(name, state);

// Show Undo UI
showUndoToast('Stamina hit 0 — Undo?', 5000, () => {
    // Undo: revert to previous value
    stat.current = prevValue;
    games[currentBook] = state;
    save({ games, currentBook });
    renderStat(name, state);
}, () => {
    // On commit: enter dead state
    enterDeadState();
});
```

This gives immediate visual feedback (stat shows 0) while the Undo window is open, without committing the dead state to the backend yet.

### Dead State Load-on-Startup

[VERIFIED: read js/app.js:43-56, js/storage.js]

On startup, `init()` calls `load()` which returns `{ games, currentBook }`. The `games[currentBook].mechanics.dead` flag will be `true` if the character died in a previous session. The `render()` call after `init()` should be modified to check `state.mechanics?.dead === true` and show `#dead-state` instead of the normal sheet.

This is the only place load-path restoration needs to happen — `init()` already calls `render()`, so adding dead-state awareness to `render()` (or a post-render check) covers the "reloading or switching devices" persistence requirement (DEFEAT-02 persistence aspect).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Timed dismiss | Custom polling loop | `setTimeout` / `clearTimeout` (native) |
| Dead state persistence | New DB column, new endpoint | `state.mechanics.dead = true` + existing `save()` |
| Stat disable on dead | New disabled prop on every button | Single `disabled` option on `renderStat()` |
| Dead-state section | CSS overlay with z-index stacking | `<section id="dead-state" hidden>` with `hidden` toggle |

---

## Common Pitfalls

### Pitfall 1: Saving Dead State Before Undo Window Expires

**What goes wrong:** `save()` is called immediately when stamina hits 0, so the PATCH commits `dead: true` to the backend. The player clicks Undo but the backend already has the dead flag.
**Why it happens:** `modifyStat()` currently calls `save()` on every change.
**How to avoid:** Do NOT call `save()` immediately when stamina=0 triggers the Undo window. Only call `save()` (with `mechanics.dead = true`) after the Undo window expires or is explicitly dismissed. Revert the stat locally on Undo without saving (or save with the reverted stat and `dead: false`).

### Pitfall 2: Long-Press Increase Bug on Dead Character

**What goes wrong:** After dead state, the long-press hold timer in `bindStatEvents()` (stats.js) could still fire if a user held the button before the stat reached 0.
**Why it happens:** `holdTimers` are module-level in `stats.js` and not cleared on stat disable.
**How to avoid:** When entering dead state, explicitly cancel any pending hold timers. Since `cancelHold(name)` is private to `stats.js`, the planner should either export it or add a `resetHoldTimers()` export, OR ensure that entering dead state sets the buttons `disabled` immediately, which prevents the hold handler from firing (`if (!combatActive) return` equivalent).

### Pitfall 3: Dead State Not Restored on Reload

**What goes wrong:** `render()` is called on startup and shows the normal sheet. The `state.mechanics.dead` flag is loaded but never acted upon.
**Why it happens:** `render()` currently calls `renderBookTitle()`, `renderCharName()`, `renderStats(state)`, and `renderBookMechanicsSection()` — none of which check the dead flag.
**How to avoid:** Add a dead-state check at the start of `render()` (or in `init()` after `render()`): if `state.mechanics?.dead` is true, call `enterDeadState()` immediately after render.

### Pitfall 4: Manual Defeat Button Appearing When Already Dead

**What goes wrong:** "I'm Dead" button is visible even when the character is already in dead state, creating a double-trigger.
**Why it happens:** The button is always rendered on the sheet.
**How to avoid:** Hide the "I'm Dead" button as part of showing the `#dead-state` section (it won't matter since the stats section is hidden, but be explicit).

### Pitfall 5: Combat Defeat Signal Race with Sheet Dead State

**What goes wrong:** During combat, player stamina hits 0. `battle.js` emits `onPlayerDefeated` callback. If Phase 9 wires `enterDeadState()` directly to that callback, the dead state section shows *while the combat modal is open*, creating a confusing visual state.
**Why it happens:** The combat defeat signal is designed for Phase 10 (modal defeat screen). Phase 9 must NOT trigger the sheet dead state from within combat.
**How to avoid:** The `onPlayerDefeated` callback in Phase 9 should be a no-op stub (or log only). The combat path to sheet dead state is Phase 10's responsibility.

### Pitfall 6: mechanics Object Spread Clobbers Existing Keys

**What goes wrong:** Setting `state.mechanics = { dead: true }` instead of `state.mechanics.dead = true` wipes all other mechanics keys (superpower, tabasha, etc.).
**Why it happens:** Object assignment replaces rather than merges.
**How to avoid:** Always use `state.mechanics.dead = true` (property assignment), not object replacement.

---

## Code Examples

### Section Toggle (Verified Pattern)

```js
// Source: js/app.js renderBookMechanicsSection()
const container = document.getElementById('book-mechanics-section');
container.hidden = true;   // hide
container.hidden = false;  // show
```

### Mechanics JSON Round-Trip (Verified Pattern)

```js
// Source: js/storage.js save()
// Write: state.mechanics is serialized as JSON in the PUT body
mechanics: game.mechanics ?? {}

// Source: js/storage.js load()
// Read: mechanics comes back as a parsed dict from the backend
games[s.book_number] = {
    mechanics: s.mechanics ?? {},
    // ...
};
```

### PATCH for Mechanics-Only Update (Verified Pattern)

```js
// Source: backend/routers/sessions.py patch_session()
// If only mechanics needs updating (lighter-weight than PUT):
await fetch(`/api/sessions/${bookNumber}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mechanics: { ...state.mechanics, dead: true } }),
});
```

### Undo Timer Pattern (Browser Native)

```js
// [ASSUMED] — standard browser API, not specific to this codebase
let undoTimer = null;

function scheduleDeadState(onUndo, onCommit, delayMs = 5000) {
    undoTimer = setTimeout(() => {
        undoTimer = null;
        onCommit();
    }, delayMs);

    // Return cancel function
    return () => {
        if (undoTimer) {
            clearTimeout(undoTimer);
            undoTimer = null;
            onUndo();
        }
    };
}
```

### renderStat with Disabled Option (Proposed Extension)

```js
// Current signature (js/ui/stats.js):
// export function renderStat(name, state)

// Proposed extension:
export function renderStat(name, state, options = {}) {
    // ...existing logic...
    if (options.disabled) {
        if (decreaseBtn) decreaseBtn.disabled = true;
        if (increaseBtn) increaseBtn.disabled = true;
    }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| No dead state | `state.mechanics.dead = true` in mechanics_json | No DB migration required |
| Defeat only visible in combat summary | Persistent `#dead-state` section | Survives reload and device switch |

---

## Key Implementation Facts

### `modifyStat()` Hook Point (app.js:218)

[VERIFIED: read js/app.js]

- Called for all stat changes (skill, stamina, luck)
- Intercept condition: `name === 'stamina' && newValue === 0`
- The function is `async` and calls `save()` — Undo implementation must delay or bypass the `save()` call
- Called from `bindStatEvents` in `ui/stats.js` via the `onModify` callback — correct place to intercept

### `rollCombatRound()` Return Value (mechanics.js:70)

[VERIFIED: read js/mechanics.js]

Current return shape:
```js
{ playerRoll, enemyRoll, playerAttack, enemyAttack, result, enemyStaminaAfter, session }
```

The `defeated` flag can be added here:
```js
const playerDefeated = (result?.session?.stamina?.current ?? null) === 0
    || (result === null && /* local fallback */ playerStamina === 0);
return { ..., defeated: playerDefeated };
```

However, player stamina after the round is authoritative from `result.session.stamina.current` (backend), not computed locally. The `battle.js` already does this check correctly at line 409: `if (playerStamina <= 0 || enemy.stamina <= 0)`. Adding the `defeated` flag to the data passed to the `onPlayerDefeated` callback is cleaner than modifying `rollCombatRound()`.

### `battleModal.js` Structure (verified)

[VERIFIED: read js/ui/battleModal.js]

`battleModal.js` exports `openBattleModal(getState, callbacks)` and `closeBattleModal()`. It uses a `wrappedCallbacks` pattern to intercept `onCombatStateChange` and `onClose`. An `onPlayerDefeated` callback can be added to the `callbacks` object and wrapped in `wrappedCallbacks`:

```js
const wrappedCallbacks = {
    ...callbacks,
    onPlayerDefeated: () => {
        // Phase 10 will implement modal defeat screen here
        // Phase 9: pass through (no-op)
        callbacks.onPlayerDefeated?.();
    },
    // ...existing wraps
};
```

App.js would wire this in the `openBattleModal(...)` call.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes with no new external dependencies. All required tools (FastAPI backend, SQLite, browser) are already in use.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `setTimeout`/`clearTimeout` 5-second timer is reliable enough for mobile UX without additional accuracy measures | Code Examples | Low — if timer fires slightly early/late on mobile, the UX impact is negligible |
| A2 | Proposed `renderStat(name, state, options)` third-argument extension does not break existing callers (all omit third arg) | Architecture Patterns | Low — JavaScript default parameter `options = {}` is backward compatible |

**All other claims in this research were verified directly from the codebase files.**

---

## Open Questions (RESOLVED)

1. **Undo toast visual: countdown indicator vs. plain button?**
   - What we know: Context.md says "Show toast/button before committing dead state"
   - What's unclear: Whether to show a visual countdown (progress bar, timer text) or just a plain Undo button
   - Recommendation: Plain Undo button is simpler and sufficient for misclick protection. Planner decides.
   - **RESOLVED:** Plain button with `setTimeout` visual cue (auto-removes after 5s). No countdown indicator — the button simply disappears when the timer expires. Implemented in 09-01-PLAN Task 1.

2. **"I'm Dead" button placement on sheet**
   - What we know: Context.md says "Located on the sheet (near stat area or as a secondary action — planner to decide placement)"
   - What's unclear: Best placement for mobile UX — near Stamina row vs. in the Actions section
   - Recommendation: In the Actions section alongside "Test Luck" and "Start Battle" — consistent with existing action patterns. Near stamina row is harder to tap accidentally on small screens.
   - **RESOLVED:** Actions section (alongside "Test Luck" and "Start Battle"), after the `.test-buttons` div. Implemented in 09-01-PLAN Task 1 as `<button class="mechanic-btn mechanic-btn--danger" id="manual-defeat-btn">`.

3. **Dead state appearance on `<main>` vs. as sibling to `<main>`**
   - What we know: Context.md says "a top-level `<section id='dead-state'>`"; current `<main>` contains all sections
   - What's unclear: "Top-level" could mean inside `<main>` (first child) or as a sibling to `<main>`
   - Recommendation: Place inside `<main class="adventure-sheet">` as the first child (shown when other content is hidden), so it inherits the parchment styling automatically.
   - **RESOLVED:** First child of `<main class="adventure-sheet">`, before the `<header>`. Shown via `hidden=false` while all sibling sections get `hidden=true`. Inherits parchment styling. Implemented in 09-01-PLAN Task 1.

---

## Sources

### Primary (HIGH confidence — verified from codebase)

- `js/app.js` — `modifyStat()` signature (line 218), `render()`, `init()`, `syncStateFromServer()`
- `js/mechanics.js` — `rollCombatRound()` return value
- `js/ui/stats.js` — `renderStat()`, `bindStatEvents()`, hold timer implementation
- `js/ui/battle.js` — defeat check at line 409, `endCombatUI()`, `callbacks.onCombatEnd()`
- `js/ui/battleModal.js` — `openBattleModal()`, `wrappedCallbacks` pattern, `teardown()`
- `js/storage.js` — `save()` PUT path, `load()` mechanics deserialization
- `backend/models.py` — `mechanics_json` column definition (line 25)
- `backend/schemas.py` — `assemble_stat_blocks()` mechanics deserialization (line 37)
- `backend/routers/sessions.py` — PATCH endpoint mechanics handling (line 100-101)
- `index.html` — section structure, `hidden` attribute usage
- `css/style.css` — `hidden` attribute pattern, `.modal-overlay.active` pattern, button disabled styles
- `.planning/codebase/CONVENTIONS.md` — D-17 pattern, `hidden` attribute convention, module boundaries
- `.planning/codebase/ARCHITECTURE.md` — data flow, state shape

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all patterns directly verified from codebase
- Architecture: HIGH — all hook points verified from source files
- Pitfalls: HIGH — derived directly from reading the code paths involved

**Research date:** 2026-04-06
**Valid until:** Stable — these are internal codebase patterns, not external API dependencies
