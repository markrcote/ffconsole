# Phase 10: Combat Modal Defeat Screen — Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

When the player loses a combat inside the battle modal, a dedicated defeat screen replaces the generic summary view. The screen is visually distinct (dark/red styling) from the victory summary. After the player dismisses the defeat screen, the modal closes and the adventure sheet enters dead state.

Requirements: DEFEAT-03, DEFEAT-04.

This phase does NOT re-implement the sheet dead state (Phase 9) or recovery actions (Phase 11). It wires the `onPlayerDefeated` stub left by Phase 9 and adds the defeat-specific UI.

</domain>

<decisions>
## Implementation Decisions

### D-01: Defeat screen visual — full dark/red modal card

The entire `.battle-modal` card switches to a dark red background when defeat occurs (not just the heading band). Stats and button sit inside the dark card.

Layout:
```
╔══════════════════════════╗
║ [dark red card bg]       ║
║                          ║
║  YOU WERE DEFEATED       ║
║  ──────────────────      ║
║  Rounds:  7              ║
║  Stamina: 0 / 18         ║
║  Goblin:  4 / 8          ║
║                          ║
║  [ Return to Sheet ]     ║
╚══════════════════════════╝
```

The CSS modifier (e.g. `.battle-modal--defeat`) toggles the dark/red background on the modal card element. Text and stats must remain readable against dark background (light text).

### D-02: Defeat screen content — full stats (rounds + both staminas)

Same data structure as the victory summary — symmetry is intentional:
- **YOU WERE DEFEATED** heading (replacing "Victory!" / "Fled")
- Rounds fought
- Player final Stamina (0 / initial)
- Enemy remaining Stamina (name / remaining / initial)
- "Return to Sheet" button

### D-03: Implementation — replace via onPlayerDefeated in battleModal.js

`endCombatUI` in `battle.js` still calls `renderSummaryHTML('enemy', ...)` (existing behavior) and then fires `callbacks.onPlayerDefeated?.()`. The change is in `battleModal.js`:

`wrappedCallbacks.onPlayerDefeated` intercepts the signal and:
1. Replaces `#combat-summary` innerHTML with defeat-screen HTML (dark card styling, same stats)
2. Sets a module-level `defeatedThisCombat = true` flag

When the player clicks "Return to Sheet" → `onClose` → `closeBattleModal()` → `teardown()` → `onModalCloseCallback()`. In `app.js`, `onModalClose` checks the defeat flag and calls `enterDeadState()` if set.

**Note:** `postCombatPending` flag in `battleModal.js` already blocks backdrop/Escape dismiss after combat ends. The defeat screen inherits this guard automatically — no additional dismiss guard needed.

### D-04: enterDeadState() fires via onModalClose after teardown

`enterDeadState()` is called in `app.js` inside `onModalClose`, gated on whether the combat resulted in defeat. This keeps dead state entry in `app.js` (consistent with Phase 9's sheet-triggered path) and avoids calling it before the modal is fully torn down.

### Claude's Discretion

- Exact color values for the dark red card (dark crimson / deep red to Claude's judgment — consistent with `.dead-state` CSS introduced in Phase 9)
- Whether to add a CSS transition when the defeat screen replaces the summary content
- Internal variable naming in battleModal.js for the defeat flag

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core implementation targets
- `js/ui/battleModal.js` — `wrappedCallbacks.onPlayerDefeated` stub (Phase 9 no-op, Phase 10 implements here); `teardown()` calls `onModalCloseCallback`; `postCombatPending` dismiss guard
- `js/ui/battle.js:287` — `endCombatUI()` — renders summary then fires `onPlayerDefeated`; `renderSummaryHTML()` at line 130 — the template Phase 10 supplements
- `js/app.js:91-95` — `onPlayerDefeated` no-op stub and comment ("Phase 10 implements modal defeat screen here")
- `js/app.js:376` — `enterDeadState()` — Phase 10 calls this from `onModalClose` on defeat

### CSS patterns
- `css/style.css` — `.dead-state` styles (lines ~1293-1353) — reference for dark/red color language to match
- `css/style.css` — `.combat-summary` and `.combat-summary__title--defeat` — existing defeat CSS modifier to build on
- `css/style.css` — `.battle-modal` — the card element that gets the `--defeat` modifier

### Requirements
- `.planning/REQUIREMENTS.md` — DEFEAT-03, DEFEAT-04

### Conventions
- `.planning/codebase/CONVENTIONS.md` — D-17 pattern (no circular imports, callbacks flow downward); template literal HTML; BEM class naming (`battle-modal--defeat`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `renderSummaryHTML(winner, rounds, playerStaminaFinal, playerStaminaInitial, enemy)` in `battle.js` — defeat stats are already computed and passed here; Phase 10 can use the same data to build defeat-screen HTML in `battleModal.js`
- `postCombatPending` flag in `battleModal.js` — already guards backdrop/Escape after combat ends; defeat screen inherits this automatically
- `onModalCloseCallback` in `battleModal.js` — already called by `teardown()`; Phase 10 uses this to trigger `enterDeadState()` in `app.js`
- `.combat-summary__title--defeat` CSS modifier — already exists, Phase 10 extends it with full-card theming

### Established Patterns
- `battleModal.js` wrappedCallbacks pattern — intercept a callback at the modal layer to add modal-specific behavior before propagating to `app.js`
- Modal card class toggle (e.g. `modal--shake`) — apply a BEM modifier class to `.battle-modal` to change its visual state
- `enterDeadState()` in `app.js` — already handles persistence, UI transition, and stat display; just needs to be invoked

### Integration Points
- `battleModal.js` `wrappedCallbacks.onPlayerDefeated` → implement here (currently just passes through)
- `app.js` `openBattleModal` call — `onModalClose` callback needs to check a defeat flag and call `enterDeadState()`
- `battle.js` `endCombatUI` → no changes needed; it already fires `onPlayerDefeated` and the stats are already passed to `renderSummaryHTML`

</code_context>

<specifics>
## Specific Ideas

- The "YOU WERE DEFEATED" heading text (caps) from the discussion mockup is the intended heading — distinct from the sheet dead state's "YOU ARE DEAD"
- Dark/red card background should feel consistent with `.dead-state` colors on the adventure sheet (match the palette)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
- **Add manual defeated button for instant-death paragraphs** — already implemented in Phase 9 (`#manual-defeat-btn`). This todo is resolved and should be closed.

</deferred>

---

*Phase: 10-combat-modal-defeat-screen*
*Context gathered: 2026-04-07*
