# Phase 5: Luck-in-Combat Testing — Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

After a hit lands in combat (in either direction), the player can optionally test their Luck to modify the damage. Lucky = improved outcome; Unlucky = worse outcome; Luck -1 either way. Standard FF rules apply:

- **Player hits enemy:** Lucky = 4 damage (not 2), Unlucky = 1 damage (not 2)
- **Enemy hits player:** Lucky = 1 damage taken (not 2), Unlucky = 3 damage taken (not 2)

The luck test is optional and triggered per-round, per-hit. It does not apply on ties.

</domain>

<decisions>
## Implementation Decisions

### UX Trigger Flow
- **D-01:** Auto-prompt after each hit — after `player_hit` or `enemy_hit` resolves, a "Test Your Luck?" button appears below the round card. Disappears when luck is tested or when next round is rolled.
- **D-02:** Luck is offered after **both directions** of hit — player hit (modify damage dealt) AND enemy hit (modify damage taken). Ties: no prompt.
- **D-03:** If the player rolls next round without testing luck, the prompt silently disappears — standard damage stands. No "Skip" button required.

### Stamina Sequencing
- **D-04:** Apply standard 2-damage immediately after the roll (stamina bars update, server session synced). If player then tests luck, stamina adjusts up or down as a second update.
- **D-05:** Luck window is ephemeral — next roll dismisses it. No persistent "pending luck" state to track between rounds.

### Round Card Display
- **D-06:** Luck result appended to the existing round card in-place (no separate card). Round card updates with a luck row after the test.
- **D-07:** Wording: "Lucky! Damage reduced to 1 Stamina" / "Unlucky! You take 3 Stamina damage" (etc.) — outcome label + final damage amount in one line.

### Action Logging
- **D-08:** New `combat_luck_test` action type (not reuse of `luck_test`). Details fields: `round`, `context` (`wounding` | `wounded`), `roll`, `success`, `luck_after`, `damage_before`, `damage_after`.
- **D-09:** Past Battles history renders luck tests inline with round entries — e.g. "R3: AS 12 vs 10 — You hit — Lucky (1 dmg)".

### Claude's Discretion
- Exact CSS class naming for the luck row in the round card
- Whether the "Test Your Luck?" button is inline in the round card or floated below it
- Backend: whether `combat_luck_test` triggers a `session` update (it should — luck stat changes)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and PROJECT.md.

### Project Context
- `CLAUDE.md` — Architecture overview, module responsibilities, D-17 pattern constraint
- `.planning/PROJECT.md` — Requirements table (luck-in-combat entry), key decisions log

### Existing Implementation
- `js/mechanics.js` — `testLuck()`, `rollCombatRound()` — entry points for luck and combat logic
- `js/ui/battle.js` — `renderBattle()`, `renderRoundCard()`, `renderRoundEntry()`, `loadCombatHistory()` — all combat UI
- `backend/routers/actions.py` — action POST/GET endpoints; `combat_luck_test` action type to be added

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `testLuck()` (`js/mechanics.js:41`) — rolls 2d6, posts `luck_test` action, returns `{roll, success, luckAfter, session}`. For combat use, a new `testCombatLuck()` function should post `combat_luck_test` instead, with round/context/damage fields.
- `renderRoundCard()` (`js/ui/battle.js:69`) — renders round result HTML. Needs an optional `luckResult` parameter to append the luck row.
- `renderRoundEntry()` (`js/ui/battle.js:385`) — renders history log entries. Needs to join adjacent `combat_luck_test` entries with the corresponding round.

### Established Patterns
- **D-17 callback pattern**: `battle.js` never imports `app.js`. Luck test must go through a callback (e.g. `onTestLuck`), not called directly. `app.js` wires the callback.
- **Server-authoritative stamina**: After any stat mutation, stamina is read from `result.session` — not computed locally. Luck-adjusted stamina must come from the server session response.
- **Action log grouping**: `loadCombatHistory()` groups logs by `combat_start` markers. `combat_luck_test` entries should be matched to their parent `combat_round` by `round` field.

### Integration Points
- `renderBattle()` in `battle.js` receives `callbacks` object — add `onTestLuck` callback
- `app.js` wires `onTestLuck` → calls `testCombatLuck()` from `mechanics.js`, then calls `onStatSync` with the session result
- `renderRoundEntry()` (history) needs to accept a luck entry from the adjacent log to show in compact form

</code_context>

<specifics>
## Specific Ideas

No specific references or "I want it like X" moments — standard FF rules and existing UI patterns apply throughout.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-luck-in-combat-testing*
*Context gathered: 2026-04-02*
