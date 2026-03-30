# Phase 3: Battle System - Research

**Researched:** 2026-03-30
**Domain:** Fighting Fantasy combat mechanics — vanilla JS UI module, FastAPI action log, stamina bar rendering
**Confidence:** HIGH (all findings sourced directly from codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Battle implemented as a panel on the existing adventure sheet (not a separate screen or modal)
- Both live Stamina tracker AND persistent round log are required
- Confirm `/api/sessions/{book}/actions` POST/GET payload shape before implementing (flagged in research SUMMARY.md)

### Claude's Discretion
- Internal structure of `js/ui/battle.js`
- Visual design of round result display
- How combat history UI is rendered (list vs accordion vs modal)

### Deferred Ideas (OUT OF SCOPE)
- Book-specific combat mechanics (poison, special attacks, etc.)
- Multi-enemy combat
- Luck-in-combat optional rule (testing luck to reduce damage)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BATTLE-01 | Start battle by entering enemy name, Skill, Stamina | HTML form already in index.html; `startCombat()` in mechanics.js; `start-combat` event handler in app.js |
| BATTLE-02 | Resolve round with single button (roll both sides, calc AS, determine winner) | `rollCombatRound()` fully implemented in mechanics.js; `roll-round` handler in app.js; backend `combat_round` action type handled |
| BATTLE-03 | Display round result (player roll, enemy roll, both AS, winner, damage) | Partial: app.js shows text result but missing player/enemy roll breakdown and AS values |
| BATTLE-04 | Live Stamina bars update after each round | Partial: `combatState.enemy.stamina` tracked; `renderCombat()` shows text only — no visual bar element or player Stamina bar in battle panel |
| BATTLE-05 | Flee combat (player loses 2 Stamina) | Partial: `flee-combat` handler exists but does NOT deduct player Stamina — `endCombat()` just logs, no server-side flee damage in actions.py |
| BATTLE-06 | Auto-end at 0 Stamina with post-battle summary | Partial: auto-end logic exists but post-battle summary is one line of text only; no outcome/rounds/damage summary |
| BATTLE-07 | Round log persists to backend, survives reload/device switch | Foundation complete: `combat_round` action POST works; GET `/api/sessions/{book}/logs` returns logs; UI needs to load and display them on init |
| BATTLE-08 | Review combat history from previous battles | Missing entirely — no log-reading UI exists anywhere |
</phase_requirements>

---

## Summary

Phase 3 is building on a solid but incomplete foundation. The backend (actions API, ActionLog model, combat action types) and the core mechanics module (`rollCombatRound`, `startCombat`, `endCombat`) are already fully operational from Phase 1. App.js has working event handlers for `start-combat`, `roll-round`, and `flee-combat`, and a `renderCombat()` function that toggles between setup and active states.

What is missing is everything the user actually sees during and after combat. The `js/ui/battle.js` file is a pure stub — one empty exported function. The active combat panel shows only plain text; there are no Stamina bars, no structured round result cards, no post-battle summary, and no history log UI. The flee action does not deduct player Stamina. The GET logs endpoint exists and returns data, but nothing in the frontend loads or renders it.

The implementation strategy is to fill `js/ui/battle.js` following the exact pattern of `diceRoller.js` (self-contained, receives container + state, no circular imports), move all combat rendering and event binding out of `app.js` into that module, and add targeted CSS for the new UI elements.

**Primary recommendation:** Implement `js/ui/battle.js` as a self-contained module that accepts `(container, getState, callbacks)` — mirroring `diceRoller.js` — covering the full combat lifecycle: setup form, active round display with structured result cards and Stamina bars, flee with damage, end-of-combat summary, and a history log panel loaded from `/api/sessions/{book}/logs`.

---

## Existing Code Inventory

### js/ui/battle.js (lines 1-7)
- **Status:** Stub only
- `renderBattle(container, battleState, playerState)` — exported but body is empty (`/* Phase 3 */`)
- No imports, no HTML, no event binding

### js/mechanics.js (lines 51-99) — COMPLETE, HIGH CONFIDENCE
All four combat functions are fully implemented and POST to the backend:

| Function | Line | Status | Notes |
|----------|------|--------|-------|
| `startCombat(book, name, skill, stamina)` | 51 | Complete | POSTs `combat_start` action |
| `rollCombatRound(book, playerSkill, round, enemyState)` | 58 | Complete | Rolls 2d6 each, calculates AS, determines result, POSTs `combat_round` |
| `endCombat(book, winner, finalPS, finalES, rounds, enemyName)` | 90 | Complete | POSTs `combat_end` action |
| `testLuck` / `testSkill` etc. | 23-49 | Complete | Existing pattern to follow |

`rollCombatRound` returns: `{ playerRoll, enemyRoll, playerAttack, enemyAttack, result, enemyStaminaAfter, session }`.
The `session` field is the full `SessionResponse` from backend (including updated `stamina.current`).

### js/app.js — PARTIAL (lines 31-35, 281-496)
**What exists:**
- `combatState` object (line 31-35): `{ active, round, enemy: { name, skill, stamina, staminaInitial } }`
- `renderCombat()` (lines 281-301): toggles `combat-setup` / `combat-active` divs, updates text for round number and enemy stamina as a string
- `start-combat` handler (428-443): reads form inputs, calls `startCombat()`, calls `renderCombat()`
- `roll-round` handler (445-487): calls `rollCombatRound()`, updates `combatState.enemy.stamina`, shows text result, calls `endCombat()` when stamina reaches 0
- `flee-combat` handler (489-496): calls `endCombat()` with `winner='fled'`, sets text — **does NOT deduct 2 Stamina from player**
- `syncStateFromServer(session)` (lines 246-254): patches `state.skill/stamina/luck.current` from server response and re-renders — already used after each round

**What is missing in app.js:**
- No loading of combat history on `init()`
- No structured round result display (BATTLE-03)
- No Stamina bar elements (BATTLE-04)
- No post-battle summary display (BATTLE-06)
- No history panel (BATTLE-08)

### index.html — PARTIAL (lines 73-101)
Combat section HTML already present:
- `#combat-setup` div: name input, skill/stamina number inputs, `#start-combat` button
- `#combat-active` div (hidden): `#combat-status` (round counter), `#combat-enemy-stamina` (text), `#combat-result` (aria-live), `#roll-round` button, `#flee-combat` button

**Missing HTML elements:**
- Player Stamina bar in combat panel
- Enemy Stamina bar (visual, not just text)
- Round result structured card (dice faces, AS values, winner, damage)
- Post-battle summary panel
- Combat history log section

### backend/routers/actions.py (lines 37-65) — COMPLETE, HIGH CONFIDENCE
**POST `/api/sessions/{book}/actions`:**
- Request body: `{ action_type: str, details: dict }`
- Response: `ActionResult` — `{ session: SessionResponse, log: ActionLogResponse }`
- Side effects on `combat_round`:
  - `result == 'enemy_hit'` → deducts 2 from `session.stamina_current`
  - `result == 'player_hit'` → no stat change (enemy stamina tracked client-side only)
  - `result == 'tie'` → no stat change
- **GAP: No flee damage handler.** There is no `combat_flee` or handling for `winner='fled'` in `endCombat`. The flee action in app.js calls `endCombat(..., 'fled', ...)` which POSTs `combat_end` with `winner='fled'` in details — but actions.py does NOT apply the 2 Stamina penalty server-side.

**GET `/api/sessions/{book}/logs`:**
- Returns: `list[ActionLogResponse]` ordered by `id DESC` (newest first)
- Each entry: `{ id, session_id, action_type, details, created_at }`
- All action types present: `combat_start`, `combat_round`, `combat_end`, `luck_test`, etc.

### backend/models.py — ActionLog (lines 31-40)
```
ActionLog:
  id          INT PK autoincrement
  session_id  INT FK → sessions.id (CASCADE DELETE)
  action_type TEXT NOT NULL
  details     TEXT NOT NULL  (JSON blob)
  created_at  TEXT NOT NULL
```
No `battle_id` grouping column — battles must be reconstructed from `combat_start`/`combat_round`/`combat_end` triplets in the log.

### backend/schemas.py
`ActionLogResponse` deserializes `details` JSON blob into `dict[str, Any]` — the frontend receives a plain object.

### css/style.css — PARTIAL
**What exists for combat:**
- `.combat-setup`, `.combat-input-row`, `.combat-label`, `.combat-input`, `.combat-input--stat`
- `.combat-status`, `.combat-enemy-stamina`, `.combat-actions`
- `.mechanic-btn`, `.mechanic-btn--primary` (shared)
- `.mechanic-result` (for `#combat-result` aria-live region)
- `.die-face` (shared — reusable for round result dice display)

**Missing CSS:**
- Stamina bar element (`.stamina-bar`, `.stamina-bar__fill`)
- Round result card (`.combat-round-card`)
- Post-battle summary (`.combat-summary`)
- History log (`.combat-log`, `.combat-log__entry`)

---

## Actions API Contract

### POST `/api/sessions/{book_number}/actions`

**Request:**
```json
{
  "action_type": "combat_round",
  "details": {
    "round": 3,
    "player_roll": 9,
    "enemy_roll": 7,
    "player_attack": 21,
    "enemy_attack": 16,
    "result": "player_hit",
    "player_stamina_after": null,
    "enemy_stamina_after": 4,
    "enemy_name": "Goblin"
  }
}
```

**Response (ActionResult):**
```json
{
  "session": {
    "id": 1,
    "book_number": 1,
    "skill": { "initial": 10, "current": 10 },
    "stamina": { "initial": 20, "current": 18 },
    "luck": { "initial": 9, "current": 7 },
    "mechanics": {},
    "name": "Alaric",
    "created_at": "...",
    "updated_at": "..."
  },
  "log": {
    "id": 42,
    "session_id": 1,
    "action_type": "combat_round",
    "details": { ... same as request details ... },
    "created_at": "2026-03-30T12:00:00Z"
  }
}
```

**Action types and their server-side mutations:**
| action_type | details shape | Server mutation |
|-------------|--------------|-----------------|
| `combat_start` | `{ enemy_name, enemy_skill, enemy_stamina }` | None |
| `combat_round` | `{ round, player_roll, enemy_roll, player_attack, enemy_attack, result, player_stamina_after, enemy_stamina_after, enemy_name }` | If `result=="enemy_hit"`: stamina_current -= 2 |
| `combat_end` | `{ winner, final_player_stamina, final_enemy_stamina, rounds, enemy_name }` | None |
| `luck_test` | `{ roll, target, success, luck_after }` | luck_current -= 1 |

**Flee gap:** `endCombat` with `winner='fled'` posts `combat_end` — no server-side Stamina deduction happens. The 2 Stamina flee penalty must be applied via a separate `combat_round` POST with `result='enemy_hit'` before the `combat_end` POST, OR by adding flee handling to actions.py.

### GET `/api/sessions/{book_number}/logs`

**Response:** `ActionLogResponse[]` (newest first by `id DESC`)
```json
[
  {
    "id": 44,
    "session_id": 1,
    "action_type": "combat_end",
    "details": { "winner": "player", "final_player_stamina": 14, "rounds": 5, "enemy_name": "Goblin" },
    "created_at": "2026-03-30T12:05:00Z"
  },
  ...
]
```

**Grouping battles from the log:** A battle is a `combat_start` entry followed by `combat_round` entries followed by a `combat_end`. Since `id` is sequential and the list is ordered `DESC`, grouping requires reversing the array and scanning for `combat_start` markers.

---

## Gap Analysis

### Built and working (no changes needed)
- `rollCombatRound()`, `startCombat()`, `endCombat()` in mechanics.js
- POST `/api/sessions/{book}/actions` for all combat action types
- GET `/api/sessions/{book}/logs` returning full log
- `combatState` object structure in app.js
- `syncStateFromServer()` for applying server stat updates after rounds
- Combat setup form HTML in index.html

### Needs extension (existing code, add to it)
- **`index.html`**: Add Stamina bar elements, round result card container, post-battle summary panel, history log section to the combat section
- **`css/style.css`**: Add `.stamina-bar`, `.combat-round-card`, `.combat-summary`, `.combat-log` classes
- **`app.js`**: Wire `renderBattle()` from battle.js into `init()` (like `renderDiceRoller`) and remove duplicated combat logic that will move to battle.js
- **`backend/routers/actions.py`**: Add flee damage handler for `combat_end` with `winner='fled'` OR handle client-side

### Needs building from scratch
- **`js/ui/battle.js`**: Full implementation — the entire UI module
- **Combat history loader**: `loadCombatHistory(bookNumber)` function calling GET logs, grouping results into battles
- **Round result display**: Structured card with die faces for player and enemy rolls, AS values, winner indicator

### Backend gap: flee Stamina penalty
The flee action currently posts `combat_end` without triggering the 2 Stamina deduction. Two options:
1. **Preferred (server-authoritative):** Add `combat_flee` handling to actions.py that applies `-2` to `stamina_current` before logging the end
2. **Alternative (simpler):** POST a `combat_round` with `result='enemy_hit'` first, then POST `combat_end` with `winner='fled'` — uses existing machinery

---

## State Design

### combatState (existing, in app.js)
```javascript
// Already defined in app.js — keep this shape, battle.js reads it
let combatState = {
    active: false,       // true while fight in progress
    round: 0,            // current round number
    enemy: {
        name: '',
        skill: 0,
        stamina: 0,      // live (decremented after player hits)
        staminaInitial: 0
    }
};
```

### No battle key in global state
The global `state` object (`{ skill, stamina, luck, mechanics, name }`) has no `battle` key. This is correct — `combatState` is local to app.js and intentionally ephemeral. On page reload, the active combat is lost (enemy Stamina resets) but the round log is restored from the backend.

**Design decision needed:** After reload, should the app attempt to restore an in-progress battle? The CONTEXT.md requirements say the round log persists (BATTLE-07), not the active combat state. Recommendation: do not restore active combat on reload; display history log instead.

### Round result display state (local to battle.js)
```javascript
// Maintained inside battle.js render scope, not persisted
let roundHistory = [];  // array of round result objects for current combat
```

---

## Round Log Schema

### What mechanics.js already POSTs for `combat_round`
```javascript
{
    round: 3,
    player_roll: 9,          // 2d6 result (not including Skill bonus)
    enemy_roll: 7,
    player_attack: 21,       // player_roll + player Skill
    enemy_attack: 16,        // enemy_roll + enemy Skill
    result: 'player_hit',    // 'player_hit' | 'enemy_hit' | 'tie'
    player_stamina_after: null,  // filled server-side from session
    enemy_stamina_after: 4,
    enemy_name: 'Goblin'
}
```

`player_stamina_after` is sent as `null` — the server applies the deduction atomically. The true player Stamina after the round comes back in `result.session.stamina.current`.

### Recommended display card per round
Each round card should show:
- Round number
- Player: dice faces (d1, d2) + `= playerRoll` + `+ Skill(N)` + `= AS(N)`
- Enemy: dice faces + `= enemyRoll` + `+ Skill(N)` + `= AS(N)`
- Result line: "You hit — Goblin takes 2 damage" / "Goblin hits — you take 2 damage" / "Tied — no damage"
- Running stamina: "Your Stamina: N" and "Goblin Stamina: N"

---

## Implementation Sequence

### Wave 1 — Backend fix + HTML scaffolding
1. Fix flee Stamina penalty in `backend/routers/actions.py` (add `combat_flee` or `combat_end` with `winner='fled'` handler)
2. Add HTML elements to `index.html`: player Stamina bar, enemy Stamina bar, round result container, post-battle summary panel, combat history section
3. Add CSS for new elements in `css/style.css`

### Wave 2 — battle.js core implementation
4. Implement `js/ui/battle.js` with:
   - `renderBattle(container, getState, callbacks)` — renders setup form into container
   - Internal `renderActive(round, result)` — shows active combat panel with bars and latest round card
   - Internal `renderSummary(outcome)` — post-battle summary
   - Event binding for start, roll-round, flee (all internal to module)
5. Wire battle.js into `app.js init()` — like `renderDiceRoller`
6. Remove duplicated combat logic from app.js (start/roll/flee handlers move to battle.js)

### Wave 3 — Persistence and history
7. `loadCombatHistory(bookNumber)` — fetch GET logs, group by combat_start markers, render history panel
8. Call `loadCombatHistory()` in `init()` after load
9. Call `loadCombatHistory()` after `combat_end` to refresh history

---

## Pitfalls

### Pitfall 1: Circular imports if battle.js calls app.js
**What goes wrong:** battle.js imports from app.js which imports from battle.js — ES module circular dependency causes silent undefined exports.
**Why it happens:** charCreate.js was careful to NOT import app.js; battle.js must follow the same pattern.
**How to avoid:** battle.js receives `getState` (a function reference returning current `state`) and `callbacks` object as arguments — never imports app.js.
**Warning signs:** `renderBattle` is called but DOM renders nothing; `getState()` returns undefined.

### Pitfall 2: Flee penalty not applied server-side
**What goes wrong:** Player flees, stamina is not reduced, next session load shows wrong Stamina.
**Why it happens:** `endCombat()` posts `combat_end` with `winner='fled'` — actions.py has no handler for this case.
**How to avoid:** Either add flee case to actions.py OR post a `combat_round` with `result='enemy_hit'` before the `combat_end` POST in the flee handler.

### Pitfall 3: Enemy Stamina only tracked client-side
**What goes wrong:** Enemy Stamina is stored only in `combatState.enemy.stamina` (local JS). On reload, it is gone.
**Why it happens:** There is no enemy Stamina column in the `sessions` table. Enemy data is only in `combat_round` log entries.
**How to avoid:** Accept this limitation — do not attempt to restore in-progress combat on reload. The round log restores history; an active fight cannot be resumed across reload (by design, per CONTEXT.md).

### Pitfall 4: Log grouping assumes sequential IDs
**What goes wrong:** If logs are fetched `DESC` and grouped by scanning for `combat_start`, reversed order might produce incorrect battle groupings if multiple sessions interleave.
**Why it happens:** No `battle_id` FK on `ActionLog`; battles are implicit sequences.
**How to avoid:** Reverse the log array first (oldest first), then scan forward for `combat_start` markers to build battle groups. Use `id` not `created_at` for ordering (IDs are guaranteed sequential within a session).

### Pitfall 5: `touch-action: manipulation` must be set on new buttons
**What goes wrong:** 300ms tap delay on mobile for roll-round and flee buttons.
**Why it happens:** CSS rule in style.css explicitly lists `.mechanic-btn` — new battle buttons that use `.mechanic-btn` will inherit this correctly. Custom elements added without that class will not.
**How to avoid:** Ensure all combat action buttons use `.mechanic-btn` or `.mechanic-btn--primary` class.

### Pitfall 6: `player_stamina_after` is null in combat_round details
**What goes wrong:** Rendering round cards from history shows `null` for player Stamina after the round.
**Why it happens:** mechanics.js sends `player_stamina_after: null`; the actual value is only known from `result.session.stamina.current` at POST time.
**How to avoid:** When displaying history from GET logs, use the session state at that point in the log sequence — or reconstruct by accumulating damage from the round sequence (enemy_hit rounds = -2 each). Alternatively, update mechanics.js to populate `player_stamina_after` from the returned session before storing — but this requires backend response at POST time.

---

## Code Examples

### Pattern: renderDiceRoller (source: js/ui/diceRoller.js)
Self-contained widget injected into a container — the exact pattern battle.js should follow:
```javascript
export function renderDiceRoller(container) {
    if (!container) return;
    container.insertAdjacentHTML('beforeend', `...`);
    const resultEl = container.querySelector('#dice-roller-result');
    container.querySelector('#roll-d6').addEventListener('click', () => { ... });
}
```
battle.js should use this same pattern: receive the container element, inject HTML, bind events locally.

### Pattern: postAction (source: js/mechanics.js lines 9-21)
How all backend action calls are structured — no changes needed:
```javascript
async function postAction(bookNumber, actionType, details) {
    try {
        const res = await fetch(`/api/sessions/${bookNumber}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_type: actionType, details }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
```

### Pattern: syncStateFromServer (source: js/app.js lines 246-254)
After each round, app.js already calls this to patch local state with server response. battle.js should accept a `onStatSync(session)` callback rather than calling syncStateFromServer directly:
```javascript
if (r.session) syncStateFromServer(r.session);
```

### Stamina bar HTML pattern (to add to index.html)
```html
<div class="stamina-bar" role="progressbar" aria-valuemin="0" aria-valuemax="20" aria-valuenow="14">
    <div class="stamina-bar__fill" style="width: 70%"></div>
</div>
```

### Loading combat history
```javascript
async function loadCombatHistory(bookNumber) {
    const res = await fetch(`/api/sessions/${bookNumber}/logs`);
    if (!res.ok) return [];
    const logs = await res.json();
    // Reverse to chronological order (GET returns newest first)
    return logs.reverse();
}
```

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely frontend JS and CSS with no new external dependencies. Backend endpoints (`/api/sessions/{book}/actions` and `/api/sessions/{book}/logs`) are confirmed operational from Phase 1.

---

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. This section is omitted.

---

## Sources

### Primary (HIGH confidence)
- `/home/claude/ffconsole/js/ui/battle.js` — stub state confirmed
- `/home/claude/ffconsole/js/mechanics.js` — all combat functions, exact return shapes
- `/home/claude/ffconsole/backend/routers/actions.py` — exact POST handler, mutation logic, flee gap
- `/home/claude/ffconsole/backend/models.py` — ActionLog columns confirmed
- `/home/claude/ffconsole/backend/schemas.py` — ActionRequest, ActionResult, ActionLogResponse shapes
- `/home/claude/ffconsole/js/app.js` — combatState structure, renderCombat(), event handlers, gaps
- `/home/claude/ffconsole/index.html` — existing combat HTML elements
- `/home/claude/ffconsole/css/style.css` — existing combat + shared CSS classes
- `/home/claude/ffconsole/js/ui/diceRoller.js` — canonical pattern for UI module structure
- `/home/claude/ffconsole/js/ui/charCreate.js` — canonical pattern for modal/complex UI
- `/home/claude/ffconsole/.planning/phases/03-battle-system/03-CONTEXT.md` — locked decisions, FF rules

---

## Metadata

**Confidence breakdown:**
- Existing code inventory: HIGH — read every relevant file directly
- Actions API contract: HIGH — read actions.py and schemas.py directly; flee gap confirmed by absence
- Gap analysis: HIGH — derived from direct file reads, not inference
- State design: HIGH — combatState structure read from app.js line 31-35
- Round log schema: HIGH — read directly from mechanics.js lines 71-81
- Pitfalls: HIGH for circular import, flee gap, enemy-stamina-not-persisted (all confirmed from code); MEDIUM for log grouping edge cases

**Research date:** 2026-03-30
**Valid until:** Stable — this is internal codebase, not a versioned library. Valid until files change.
