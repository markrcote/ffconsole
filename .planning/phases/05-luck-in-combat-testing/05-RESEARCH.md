# Phase 5: Luck-in-Combat Testing — Research

**Researched:** 2026-04-02
**Domain:** Vanilla JS combat UI, FastAPI action log, SQLite stat mutation
**Confidence:** HIGH — all findings from direct source inspection, no external libraries needed

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Auto-prompt after each hit — after `player_hit` or `enemy_hit` resolves, a "Test Your Luck?" button appears below the round card. Disappears when luck is tested or when next round is rolled.
- **D-02:** Luck is offered after **both directions** of hit — player hit (modify damage dealt) AND enemy hit (modify damage taken). Ties: no prompt.
- **D-03:** If the player rolls next round without testing luck, the prompt silently disappears — standard damage stands. No "Skip" button required.
- **D-04:** Apply standard 2-damage immediately after the roll (stamina bars update, server session synced). If player then tests luck, stamina adjusts up or down as a second update.
- **D-05:** Luck window is ephemeral — next roll dismisses it. No persistent "pending luck" state to track between rounds.
- **D-06:** Luck result appended to the existing round card in-place (no separate card). Round card updates with a luck row after the test.
- **D-07:** Wording: "Lucky! Damage reduced to 1 Stamina" / "Unlucky! You take 3 Stamina damage" (etc.) — outcome label + final damage amount in one line.
- **D-08:** New `combat_luck_test` action type (not reuse of `luck_test`). Details fields: `round`, `context` (`wounding` | `wounded`), `roll`, `success`, `luck_after`, `damage_before`, `damage_after`.
- **D-09:** Past Battles history renders luck tests inline with round entries — e.g. "R3: AS 12 vs 10 — You hit — Lucky (1 dmg)".
- **D-17 callback pattern:** battle.js never imports app.js directly. Luck test must go through a callback (e.g. `onTestLuck`), not called directly. app.js wires the callback.

### Claude's Discretion
- Exact CSS class naming for the luck row in the round card
- Whether the "Test Your Luck?" button is inline in the round card or floated below it
- Backend: whether `combat_luck_test` triggers a `session` update (it should — luck stat changes)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 5 adds an optional luck test immediately after any combat hit (both directions). All source code needed exists and is well-structured. The work is additive, not refactoring: one new mechanic function, targeted modifications to `battle.js` and its caller in `app.js`, a new backend action type handler, and new CSS classes.

The D-17 callback pattern is already established — `renderBattle()` accepts a `callbacks` object and `app.js` wires all the functions. Adding `onTestLuck` follows exactly the same structure as `onRollRound`. The backend action system is untyped (the `action_type` field is a plain string with no enum validation — any string is accepted), so adding `combat_luck_test` requires only adding a mutation handler in the `post_action` if-chain, not any schema changes.

The largest complexity is coordinating the ephemeral luck-prompt lifecycle within the existing roll-round event handler in `battle.js`. The prompt must (a) appear only after a hit, (b) disappear when the next roll begins, and (c) trigger a callback that updates stamina, re-renders the round card, and fires `onStatSync`. This is self-contained in `battle.js`'s local closure.

**Primary recommendation:** Implement as four distinct units: (1) `testCombatLuck()` in mechanics.js, (2) backend handler for `combat_luck_test`, (3) luck prompt + round-card update in battle.js, (4) history rendering of luck entries in `loadCombatHistory()`.

---

## Research Findings

### Q1 — `testLuck()` exact signature and action posting

**File:** `js/mechanics.js` lines 41–49

```
export async function testLuck(bookNumber, luckCurrent) {
    const roll = rollMultiple(2);
    const success = roll <= luckCurrent;
    const luckAfter = Math.max(0, luckCurrent - 1);
    const result = await postAction(bookNumber, 'luck_test', {
        roll, target: luckCurrent, success, luck_after: luckAfter,
    });
    return { roll, target: luckCurrent, success, luckAfter, session: result?.session ?? null };
}
```

- Posts to `/api/sessions/{bookNumber}/actions` with `action_type: 'luck_test'`
- The backend handler (`actions.py:46`) mutates `session.luck_current` by -1 atomically
- Returns `{ roll, target, success, luckAfter, session }` where `session` is a full `SessionResponse`
- `result?.session ?? null` — safe even if the server returns null

**For `testCombatLuck()`:** Same structure, different action type (`combat_luck_test`), additional fields in details: `round`, `context`, `damage_before`, `damage_after`.

---

### Q2 — `rollCombatRound()` exact signature and return value

**File:** `js/mechanics.js` lines 58–88

```
export async function rollCombatRound(bookNumber, playerSkill, round, enemyState)
```

Parameters:
- `bookNumber` — the book session key
- `playerSkill` — `state.skill.current` at time of roll (passed from battle.js via getState)
- `round` — current round counter (integer, starts at 1)
- `enemyState` — `{ name, skill, stamina }` (staminaInitial not needed here)

Returns:
```
{ playerRoll, enemyRoll, playerAttack, enemyAttack, result, enemyStaminaAfter, session }
```

Where:
- `result` is `'player_hit' | 'enemy_hit' | 'tie'`
- `enemyStaminaAfter` — computed locally (subtracted 2 if player_hit, else unchanged)
- `session` — `SessionResponse | null` from server

Critical: the server applies the -2 stamina damage for `enemy_hit` in `actions.py:49-52`. For `player_hit`, the enemy stamina is computed locally in `rollCombatRound()` (line 69) and returned as `enemyStaminaAfter`. For `enemy_hit`, the player stamina reduction is done server-side, so `r.session.stamina.current` is authoritative.

---

### Q3 — `renderRoundCard()` structure

**File:** `js/ui/battle.js` lines 74–109

```
function renderRoundCard(round, result, enemy, playerStamina, playerSkill)
```

Returns an HTML string. The card structure:
```html
<div class="combat-round-card">
  <div class="combat-round-card__header">Round N</div>
  <div class="combat-round-card__row"> <!-- player row with dice + skill + attack score --> </div>
  <div class="combat-round-card__row"> <!-- enemy row with dice + skill + attack score --> </div>
  <div class="combat-round-card__outcome combat-round-card__outcome--{result}">
    {outcomeText}
  </div>
</div>
```

The outcome modifier classes are:
- `combat-round-card__outcome--player_hit` → green (`var(--accent-green)`)
- `combat-round-card__outcome--enemy_hit` → red (`var(--accent-red)`)
- `combat-round-card__outcome--tie` → muted (`var(--ink-light)`)

Note: the outcome text currently hardcodes "2 damage" — this must change to accommodate luck adjustment. Two approaches:

**Option A (recommended):** Re-render the full round card after luck test, passing a `luckResult` parameter that appends a luck row beneath the outcome div. The outcome div text updates too (or the luck row overrides it).

**Option B:** Inject a luck row element into the existing DOM node directly. More fragile; not recommended.

For D-06 ("appended to existing round card in-place"), the cleanest implementation is to re-render `roundResultEl.innerHTML` with the new card HTML — since `renderRoundCard()` returns a string and `roundResultEl` is a direct reference, this is a single assignment.

---

### Q4 — `renderRoundEntry()` history rendering

**File:** `js/ui/battle.js` lines 385–396

```
function renderRoundEntry(roundLog) {
    const d = roundLog.details || {};
    const r = d.round ?? '?';
    const pa = d.player_attack ?? '?';
    const ea = d.enemy_attack ?? '?';
    const resultText = d.result === 'player_hit' ? 'You hit'
        : d.result === 'enemy_hit' ? 'Enemy hit' : 'Tie';
    return `<div class="combat-log__entry">R${r}: AS ${pa} vs ${ea} — ${resultText}</div>`;
}
```

Currently produces: `R3: AS 12 vs 10 — You hit`

For D-09 ("R3: AS 12 vs 10 — You hit — Lucky (1 dmg)"), `renderRoundEntry()` must accept an optional `luckLog` parameter (the adjacent `combat_luck_test` entry for this round). If present, append the luck suffix.

`renderBattleEntry()` (lines 401–424) calls `renderRoundEntry()` per round via `.map()`. It needs to pass the matching luck log for each round. The matching key is `luckLog.details.round === roundLog.details.round`.

---

### Q5 — `loadCombatHistory()` grouping logic

**File:** `js/ui/battle.js` lines 434–504

The filter at lines 446–449:
```js
const combatLogs = logs.filter(l =>
    l.action_type === 'combat_start' ||
    l.action_type === 'combat_round' ||
    l.action_type === 'combat_end'
);
```

`combat_luck_test` entries are currently **excluded** by this filter. To incorporate them, the filter must add `l.action_type === 'combat_luck_test'`.

The grouping loop (lines 457–468) assigns `combat_start` → new battle, `combat_round` → pushed to `current.rounds`, `combat_end` → closes the battle. A new arm is needed: `combat_luck_test` entries should be pushed to a `current.luckTests` array (keyed to the battle, not a round). The `renderBattleEntry()` function then joins each luck test to its round by matching `details.round`.

Structure change to the `battle` object:
```
{ start, rounds, luckTests: [], end }
```

---

### Q6 — `callbacks` object structure in `renderBattle()`

**File:** `js/app.js` lines 73–81, `js/ui/battle.js` line 154

Current `callbacks` shape (as called in `app.js`):
```js
{
    onStart: startCombat,         // (bookNumber, name, skill, stamina) → { session }
    onRollRound: rollCombatRound, // (bookNumber, skill, round, enemy) → { ...result, session }
    onFlee: endCombat,            // (bookNumber, winner, pStam, eStam, round, name) → { session }
    onEnd: endCombat,             // same signature as onFlee
    onStatSync: syncStateFromServer, // (session) → void
    onCombatEnd: () => { combatState.active = false; },
}
```

Used in `battle.js` at lines 238, 267, 343, 311, 273, 278, 322.

`onTestLuck` must be added. Proposed signature (wired in `app.js`):
```js
onTestLuck: (bookNumber, luckCurrent, round, context, damageBefore) → Promise<{ roll, success, luckAfter, damageAfter, session }>
```

The callback is called from inside `battle.js`'s roll-round handler after the luck prompt is clicked. It calls `testCombatLuck()` from mechanics.js, then the result is used to re-render the round card and fire `onStatSync`.

---

### Q7 — Action type validation in the backend

**File:** `backend/routers/actions.py` lines 42–70
**File:** `backend/schemas.py` lines 60–62

`ActionRequest` is:
```python
class ActionRequest(BaseModel):
    action_type: str
    details: dict[str, Any]
```

`action_type` is a plain `str` — **no enum, no allowed-values validation**. Any string is accepted and stored. The `post_action` function uses an if/elif chain to decide what stat mutations to apply. Adding `combat_luck_test` means adding a new `elif` branch:

```python
elif body.action_type == "combat_luck_test":
    context = body.details.get("context")
    damage_delta = body.details.get("damage_after", 2) - body.details.get("damage_before", 2)
    session.luck_current = max(0, session.luck_current - 1)
    if context == "wounded":  # enemy hit player
        session.stamina_current = max(0, session.stamina_current - body.details.get("damage_after", 2) + body.details.get("damage_before", 2))
    elif context == "wounding":  # player hit enemy (no server-side enemy stamina — that's local)
        pass  # luck deduction above is sufficient; enemy stamina correction is client-side
    session.updated_at = _now()
```

Wait — re-examining the stamina mutation design more carefully:

For `enemy_hit` (context = `wounded`): The initial 2-damage was already applied by the `combat_round` handler. The luck test needs to apply the *delta* (e.g., lucky: was -2, should be -1, so restore +1; unlucky: was -2, should be -3, so deduct -1 more). The server can apply this delta using `damage_before` and `damage_after` from the details payload.

For `player_hit` (context = `wounding`): Enemy stamina is tracked locally in `battle.js` (not in the DB session). The luck adjustment to enemy stamina is applied client-side by updating the local `enemy.stamina` variable. Only the luck deduction needs server-side handling.

**Exact server-side mutations for `combat_luck_test`:**
1. Always: `luck_current -= 1`
2. Only if `context == "wounded"`: `stamina_current += (damage_before - damage_after)` — this handles both lucky (+1 restore) and unlucky (-1 extra deduction) via the sign of the expression

---

### Q8 — Existing CSS classes for luck outcomes

**File:** `css/style.css` lines 957–1010

Existing luck classes (from standalone luck test widget):
```
.luck-result                 — container
.luck-result__dice           — die faces row
.luck-result__plus           — "+" separator
.luck-result__total          — "= N" total
.luck-result__label          — "Lucky!" / "Unlucky." label
.luck-result__label--lucky   — accent-red color
.luck-result__label--unlucky — ink-color, lighter weight
.luck-result__footnote       — "Luck is now N"
```

**These classes are NOT suitable for the combat round card luck row.** The combat round card uses a BEM block `combat-round-card__*` and is compact (one-liner per row). New classes needed:

```
.combat-round-card__luck        — the luck row container (below outcome)
.combat-round-card__luck--lucky  — green modifier
.combat-round-card__luck--unlucky — red modifier
```

The "Test Your Luck?" button should use `.mechanic-btn` (existing class, used on Roll Round and Flee buttons) for visual consistency. It can be injected below `.combat-round-card` into `roundResultEl` rather than inside the card HTML itself — this is cleaner because it disappears on next roll without touching the card.

---

## Integration Map

### File: `js/mechanics.js` — ADD `testCombatLuck()`

New export below `testLuck()` (after line 49):

```js
export async function testCombatLuck(bookNumber, luckCurrent, round, context, damageBefore) {
    const roll = rollMultiple(2);
    const success = roll <= luckCurrent;
    const luckAfter = Math.max(0, luckCurrent - 1);

    let damageAfter;
    if (context === 'wounding') {
        // player hit enemy: lucky = 4 dmg, unlucky = 1 dmg
        damageAfter = success ? 4 : 1;
    } else {
        // enemy hit player (wounded): lucky = 1 dmg taken, unlucky = 3 dmg taken
        damageAfter = success ? 1 : 3;
    }

    const result = await postAction(bookNumber, 'combat_luck_test', {
        round,
        context,
        roll,
        success,
        luck_after: luckAfter,
        damage_before: damageBefore,
        damage_after: damageAfter,
    });
    return { roll, success, luckAfter, damageAfter, session: result?.session ?? null };
}
```

---

### File: `backend/routers/actions.py` — ADD `combat_luck_test` handler

Insert new `elif` after the existing `combat_round` branch (after line 52):

```python
elif body.action_type == "combat_luck_test":
    context = body.details.get("context")
    damage_before = body.details.get("damage_before", 2)
    damage_after = body.details.get("damage_after", 2)
    session.luck_current = max(0, session.luck_current - 1)
    if context == "wounded":
        # Adjust player stamina: undo original damage, apply luck-adjusted damage
        stamina_delta = damage_before - damage_after
        session.stamina_current = max(0, session.stamina_current + stamina_delta)
    session.updated_at = _now()
```

No schema changes needed — `action_type` is already `str`, `details` is already `dict[str, Any]`.

---

### File: `js/ui/battle.js` — MODIFY roll-round handler + history

**1. Add `onTestLuck` to the roll-round handler (lines 258–330)**

After the round card is rendered (line 290–294), check if the result is a hit and show the luck prompt. The prompt is inserted as a sibling element after `roundResultEl`, or appended to `roundResultEl`'s parent.

Recommended: insert a `<div id="luck-prompt">` element immediately after `roundResultEl` (or a wrapper `<div id="luck-prompt-slot">` in `index.html`). When the next round roll begins (line 265 area), remove/clear the luck prompt.

**Luck prompt flow inside rollRoundBtn click handler:**

```
// (existing) render round card
// NEW: if result is a hit, inject luck prompt
if (r.result !== 'tie') {
    const context = r.result === 'player_hit' ? 'wounding' : 'wounded';
    showLuckPrompt(context, round, r);
}
// NEW: round++ and re-enable only after luck prompt is dismissed OR skipped
// But D-03 says next roll dismisses it — so re-enable immediately; 
// prompt dismisses itself when next roll starts
```

**`showLuckPrompt(context, round, roundResult)` helper (inside renderBattle closure):**

- Creates a button element with text "Test Your Luck?"
- Uses `.mechanic-btn` class
- Appends below `roundResultEl`
- Button click:
  1. Remove the prompt
  2. Call `await callbacks.onTestLuck(currentBook, getState().state.luck.current, round, context, 2)`
  3. Update `enemy.stamina` if context is `wounding` (local adjustment: `enemy.stamina = enemy.stamina - r.damageAfter + 2`)
  4. If `r.session`, call `callbacks.onStatSync(r.session)` — this re-renders luck stat
  5. Re-render round card with luck result appended (update `roundResultEl.innerHTML`)
  6. Update stamina bars

**Dismiss on next roll:** At the start of the rollRoundBtn click handler (before the async call), call `dismissLuckPrompt()` which removes the existing prompt element if present.

**2. Modify `renderRoundCard()` to accept an optional luck result**

Add a `luckResult` parameter (default `null`):

```js
function renderRoundCard(round, result, enemy, playerStamina, playerSkill, luckResult = null)
```

If `luckResult` is provided, append a luck row inside `.combat-round-card`:

```html
<div class="combat-round-card__luck combat-round-card__luck--{lucky|unlucky}">
    {Lucky! / Unlucky!} — {context label} {damageAfter} damage
</div>
```

**3. Modify `renderRoundEntry()` to accept an optional luck log**

```js
function renderRoundEntry(roundLog, luckLog = null)
```

If `luckLog`:
```js
const luckSuffix = luckLog
    ? ` — ${luckLog.details.success ? 'Lucky' : 'Unlucky'} (${luckLog.details.damage_after} dmg)`
    : '';
return `<div class="combat-log__entry">R${r}: AS ${pa} vs ${ea} — ${resultText}${luckSuffix}</div>`;
```

**4. Modify `loadCombatHistory()` filter and grouping**

Filter (line 446): add `|| l.action_type === 'combat_luck_test'`

Grouping loop: add new arm:
```js
} else if (current && log.action_type === 'combat_luck_test') {
    current.luckTests.push(log);
}
```

And initialise `luckTests: []` when creating a new battle object.

In `renderBattleEntry()`, build a lookup map from round number to luck log:
```js
const luckByRound = {};
battle.luckTests.forEach(lt => { luckByRound[lt.details.round] = lt; });
const roundsHTML = battle.rounds.map(r =>
    renderRoundEntry(r, luckByRound[r.details?.round] ?? null)
).join('');
```

---

### File: `js/app.js` — ADD `onTestLuck` callback

In the `renderBattle()` call (lines 74–81), add:

```js
onTestLuck: (bookNumber, luckCurrent, round, context, damageBefore) =>
    testCombatLuck(bookNumber, luckCurrent, round, context, damageBefore),
```

And add `testCombatLuck` to the import from `./mechanics.js` (line 8).

---

### File: `css/style.css` — ADD luck row styles

New block appended after the `.combat-round-card__outcome--tie` block (after line 672):

```css
/* Luck-in-combat row (Phase 5) */
.combat-round-card__luck {
    font-family: 'Caveat', cursive;
    font-size: 1rem;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed var(--parchment-stain);
}

.combat-round-card__luck--lucky {
    color: var(--accent-green);
}

.combat-round-card__luck--unlucky {
    color: var(--accent-red);
}

/* Luck prompt button below round card */
.luck-prompt {
    margin-top: 8px;
    display: flex;
    justify-content: center;
}
```

The "Test Your Luck?" button reuses `.mechanic-btn` — no new button class needed.

---

## Risk Areas

### Risk 1 — Stamina double-mutation on `combat_luck_test`

The `combat_round` handler already applied -2 stamina for `enemy_hit`. The `combat_luck_test` handler must apply a *delta* (not a full replacement). If `damage_before` and `damage_after` are both 2 (no luck test effect), the delta is 0 — safe. The formula `stamina_delta = damage_before - damage_after` must be positive for lucky (restore) and negative for unlucky (extra deduction).

Example:
- enemy_hit lucky: `damage_before=2, damage_after=1` → `stamina_delta = +1` → stamina restored by 1
- enemy_hit unlucky: `damage_before=2, damage_after=3` → `stamina_delta = -1` → stamina reduced by 1 more

**Mitigation:** Verify the formula sign direction in the backend handler with these exact examples before coding.

### Risk 2 — Enemy stamina is local, not server-side

Enemy stamina lives in the local `enemy` variable in `battle.js`'s closure (line 160). It is never persisted to the session. For `player_hit` luck tests, the damage adjustment to enemy stamina must be applied to `enemy.stamina` directly in `battle.js`, not via `onStatSync`. The stamina bars must be re-updated after this correction.

**Mitigation:** After luck test callback returns with `context === 'wounding'`, apply:
```js
enemy.stamina = Math.max(0, enemy.stamina - luckResult.damageAfter + 2);
```
Then call `updateStaminaBars()` again.

### Risk 3 — Combat-end check must use post-luck stamina

The combat-end check currently happens after `rollCombatRound()` at line 308. If luck modifies damage after that point, the check runs on the pre-luck stamina. This could cause a missed end-condition (e.g., enemy stamina drops to 0 via lucky hit but the end-check already ran).

**Mitigation:** Re-run the combat-end check after the luck test resolves. Or, after the luck button click resolves, check `enemy.stamina <= 0` and trigger `callbacks.onEnd()` if needed. This needs careful sequencing in the luck button click handler.

### Risk 4 — Luck prompt lingering if user navigates away or combat ends abruptly

If combat ends (player dies from `enemy_hit` that was already at stamina 0) while the luck prompt is visible, it could persist. The `endCombatUI()` function doesn't know about the prompt element.

**Mitigation:** `endCombatUI()` should also call `dismissLuckPrompt()`. Since both run in the same closure, this is straightforward.

### Risk 5 — `renderRoundCard()` is a pure function returning a string

The luck-appended version needs to re-render the whole card with `luckResult` included. Since the function returns a string and `roundResultEl.innerHTML` is set directly, this is safe — calling it again with a `luckResult` argument simply produces the updated HTML. No DOM diffing needed, no stale references.

### Risk 6 — History luck log matching by round number within a battle

If a player flees mid-battle and starts a new battle, round numbers restart from 1. The `luckByRound` lookup must be scoped to each `battle` object (not global). Since `current.luckTests` is per-battle, this is inherently correct — but verify the lookup map is rebuilt fresh per `renderBattleEntry()` call.

---

## Architecture Patterns

### Callback Pattern (D-17)

`battle.js` already uses a closure-based callback pattern. `onTestLuck` is wired exactly like `onRollRound`:

```
app.js                         battle.js (closure)
-------                        --------
renderBattle(                  rollRoundBtn.click → callbacks.onRollRound(...)
  ...,
  { onRollRound: rollCombatRound,
    onTestLuck: testCombatLuck,  ← new
    ... }
)
```

### Server-Authoritative Stamina Pattern

After any action that mutates server state:
1. POST to `/api/sessions/{book}/actions`
2. Response contains `{ session, log }` — `session` is the updated `SessionResponse`
3. Pass `session` to `callbacks.onStatSync(session)` in `app.js`
4. `syncStateFromServer()` updates local state and re-renders stat rows

This pattern must be followed for `combat_luck_test` — the luck deduction and any player stamina adjustment are applied server-side atomically, and the returned session is the source of truth.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Luck stat deduction | Client-side `state.luck.current -= 1` | POST `combat_luck_test` action → read back from `result.session` via `onStatSync` |
| Enemy stamina correction | Any persistence scheme | Mutate local `enemy.stamina` in battle.js closure directly |
| Button de-duplication (prevent double-tap) | Custom lock variable | `button.disabled = true` before async call, re-enable after |
| Prompt removal on next roll | Separate state flag | Check `document.getElementById('luck-prompt-btn')` at start of roll handler |

---

## Common Pitfalls

### Pitfall 1 — Forgetting to dismiss the prompt at roll start

**What goes wrong:** Player clicks "Roll Round", prompt stays visible from previous round.
**Root cause:** The prompt injection and the roll-round handler are separate code paths.
**How to avoid:** First line of the rollRoundBtn click handler (before async): `dismissLuckPrompt()`.

### Pitfall 2 — Re-enabling Roll Round / Flee before luck prompt is dismissed

**What goes wrong:** Player clicks luck test AND rolls next round simultaneously (race condition in async).
**Root cause:** `setButtonsDisabled(false)` is called after the round card renders, before luck test resolves.
**How to avoid:** Leave Roll Round / Flee enabled as specified by D-03 — the luck prompt is optional and its lifecycle is independent. The prompt self-dismisses on next roll. No special disable needed.

### Pitfall 3 — Context `'wounding'` vs `'wounded'` string constants

**What goes wrong:** Mismatched strings between mechanics.js, battle.js, and the backend handler.
**Root cause:** These strings are used in three places without a shared constant.
**How to avoid:** Use the exact strings `'wounding'` and `'wounded'` consistently. Consider defining them as constants at the top of mechanics.js.

### Pitfall 4 — `damage_before` is always 2, but should be passed explicitly

**What goes wrong:** Hardcoding 2 as `damage_before` everywhere. If a future book config changes base combat damage, this breaks.
**How to avoid:** Pass `damageBefore` explicitly from the caller. In Phase 5 it will always be 2, but the API should take it as a parameter.

### Pitfall 5 — Luck result text wording in the round card vs the history log

D-07 specifies round card wording ("Lucky! Damage reduced to 1 Stamina"). D-09 specifies history wording ("Lucky (1 dmg)"). These are different formats for the same data — don't reuse one rendering function for both.

---

## Standard Stack

No new libraries. All implementation uses existing stack:

| Component | Technology | Existing Pattern |
|-----------|------------|-----------------|
| Mechanic function | Vanilla JS async/await | `testLuck()` in mechanics.js |
| Action logging | `fetch` POST to `/api/sessions/{book}/actions` | `postAction()` helper |
| UI injection | `element.innerHTML = string` | `roundResultEl.innerHTML = renderRoundCard(...)` |
| Stat sync | Server response → `syncStateFromServer()` | All existing mechanics |
| Backend mutation | SQLAlchemy + if/elif chain | `actions.py` post_action |
| CSS | BEM class naming on existing elements | `combat-round-card__*` pattern |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure code/config changes within existing stack).

---

## Sources

### Primary (HIGH confidence)
- `js/mechanics.js` (lines 41–88) — direct source inspection, testLuck and rollCombatRound signatures
- `js/ui/battle.js` (lines 74–504) — direct source inspection, all rendering functions and history grouping
- `js/app.js` (lines 73–81) — direct source inspection, callbacks wiring and syncStateFromServer
- `backend/routers/actions.py` (lines 42–70) — direct source inspection, action handler and mutation logic
- `backend/schemas.py` (lines 60–62) — direct source inspection, ActionRequest is untyped str
- `css/style.css` (lines 616–672, 957–1010) — direct source inspection, existing combat and luck CSS classes
- `index.html` (lines 76–134) — direct source inspection, DOM element IDs used by battle.js

## Metadata

**Confidence breakdown:**
- Integration map: HIGH — based on direct code reading, all signatures verified
- Backend mutation logic: HIGH — formula verified against existing stamina-delta pattern
- Risk areas: HIGH — all identified from concrete code paths

**Research date:** 2026-04-02
**Valid until:** Stable — no external dependencies; valid until source files change
