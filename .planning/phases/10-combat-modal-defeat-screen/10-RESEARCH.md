# Phase 10: Combat Modal Defeat Screen — Research

**Researched:** 2026-04-07
**Domain:** Vanilla JS modal UI / CSS theming / callback wiring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Defeat screen visual — full dark/red modal card**
The entire `.battle-modal` card switches to a dark red background when defeat occurs (not just the heading band). Stats and button sit inside the dark card. The CSS modifier `.battle-modal--defeat` toggles the dark/red background on the modal card element. Text and stats must remain readable against dark background (light text).

**D-02: Defeat screen content — full stats (rounds + both staminas)**
Same data structure as the victory summary:
- "YOU WERE DEFEATED" heading
- Rounds fought
- Player final Stamina (0 / initial)
- Enemy remaining Stamina (name / remaining / initial)
- "Return to Sheet" button

**D-03: Implementation — replace via onPlayerDefeated in battleModal.js**
`wrappedCallbacks.onPlayerDefeated` in `battleModal.js` intercepts the signal and:
1. Replaces `#combat-summary` innerHTML with defeat-screen HTML (dark card styling, same stats)
2. Sets a module-level `defeatedThisCombat = true` flag

**D-04: enterDeadState() fires via onModalClose after teardown**
`enterDeadState()` is called in `app.js` inside `onModalClose`, gated on whether the combat resulted in defeat. Keeps dead state entry in `app.js` and avoids calling it before the modal is fully torn down.

### Claude's Discretion

- Exact color values for the dark red card (dark crimson / deep red — consistent with `.dead-state` CSS from Phase 9)
- Whether to add a CSS transition when the defeat screen replaces the summary content
- Internal variable naming in `battleModal.js` for the defeat flag

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEFEAT-03 | When combat ends in defeat, a defeat screen appears inside the modal, visually distinct from the victory summary | D-01, D-02, D-03: `.battle-modal--defeat` modifier + innerHTML replacement in `wrappedCallbacks.onPlayerDefeated` |
| DEFEAT-04 | After the defeat screen is dismissed, the modal closes and the adventure sheet shows a dead state | D-03, D-04: `defeatedThisCombat` flag checked in `onModalClose` to call `enterDeadState()` |
</phase_requirements>

---

## Summary

Phase 10 wires the `onPlayerDefeated` stub that Phase 9 left as a no-op in `battleModal.js`. The work is purely frontend — three files change: `battleModal.js` (implement the stub, add the defeat flag), `app.js` (update `onModalClose` to check the flag and call `enterDeadState()`), and `css/style.css` (add `.battle-modal--defeat` card-level styling).

All the supporting infrastructure already exists. `endCombatUI` in `battle.js` already calls `callbacks.onPlayerDefeated?.()` after rendering the summary and already passes all the stat data needed for the defeat screen. The `postCombatPending` guard already prevents premature modal dismissal. `enterDeadState()` in `app.js` already handles persistence and UI transition. No new patterns are required — this phase is entirely assembly and CSS.

**Primary recommendation:** Implement `wrappedCallbacks.onPlayerDefeated` in `battleModal.js` to (1) add `.battle-modal--defeat` to the modal card, (2) replace `#combat-summary` innerHTML with defeat-screen markup, (3) set `defeatedThisCombat = true`. In `app.js` `onModalClose`, check the flag and call `enterDeadState()` if set. Add CSS for `.battle-modal--defeat` that overrides the card background to dark crimson and switches text to a light color.

---

## Standard Stack

No new libraries. This phase is pure vanilla JS + CSS. [VERIFIED: codebase inspection]

| File | Role | Change Type |
|------|------|-------------|
| `js/ui/battleModal.js` | Modal lifecycle, wrappedCallbacks | Implement stub, add flag |
| `js/app.js` | App-level orchestration | Update `onModalClose` |
| `css/style.css` | Styles | Add `.battle-modal--defeat` block |

---

## Architecture Patterns

### Signal Flow (Locked by D-03, D-04)

```
battle.js endCombatUI()
  → callbacks.onPlayerDefeated?.()          [already fires when winner === 'enemy']
    → battleModal.js wrappedCallbacks.onPlayerDefeated  [IMPLEMENT HERE]
        1. summaryEl = overlay.querySelector('#combat-summary')
        2. modalEl.classList.add('battle-modal--defeat')
        3. summaryEl.innerHTML = defeatScreenHTML(rounds, playerStamina, enemy)
        4. defeatedThisCombat = true
        5. re-bind #close-battle click → callbacks.onClose?.()
            → closeBattleModal() → teardown() → onModalCloseCallback()
              → app.js onModalClose [IMPLEMENT CHECK HERE]
                  if (defeatedThisCombat) enterDeadState();
```

[VERIFIED: codebase inspection of `battleModal.js`, `battle.js`, `app.js`]

### wrappedCallbacks Pattern

`battleModal.js` already uses this pattern for `onCombatStateChange` and `onClose`. Phase 10 fills in the already-scaffolded `onPlayerDefeated` wrapper. [VERIFIED: `battleModal.js` lines 143-148]

```js
// Current no-op stub (battleModal.js lines 145-148):
onPlayerDefeated: () => {
    // Phase 10 will implement modal defeat screen here
    callbacks.onPlayerDefeated?.();
},
```

The stub propagates to `app.js`'s no-op. Phase 10 replaces the stub body with the real implementation; the propagation to `app.js` `onPlayerDefeated` callback can be dropped (the defeat path now lives entirely in `battleModal.js` + `onModalClose`).

### Data Availability in onPlayerDefeated

The callback fires from `endCombatUI` in `battle.js` (line 313), which is a closure over:
- `round` — current round count
- `enemy` — `{ name, skill, stamina, staminaInitial }` (enemy.stamina is the remaining value at combat end)
- `playerStaminaFinal` — the `playerStamina` argument to `endCombatUI`
- `state.stamina.initial` — read via `getState().state.stamina.initial`

However, `onPlayerDefeated` receives **no arguments** in the current implementation. The defeat screen HTML must be built from data available inside `battleModal.js` or re-fetched via `getState()`.

**Resolution:** `battleModal.js` has access to `getState` (it's the argument to `openBattleModal`). For enemy data and rounds, two options exist:

**Option A (simpler):** Don't duplicate the stats in `onPlayerDefeated`. Instead, the summary HTML rendered by `battle.js` is already in `#combat-summary`. The `onPlayerDefeated` hook replaces the `#combat-summary` inner content, but can read the stats directly from `getState()` and the combat state for enemy info.

**Option B (cleaner, aligns with D-03):** Pass the relevant stats as arguments when `onPlayerDefeated` is called. This requires a one-line change in `battle.js` `endCombatUI`: `callbacks.onPlayerDefeated?.(round, playerStaminaFinal, enemy)`.

**Recommendation (Claude's discretion):** Option B. Passing arguments is one line in `battle.js` and makes `battleModal.js`'s implementation self-contained without needing to reach back through `getState()` for combat data it shouldn't own. Aligns better with the callbacks-flow-downward convention (CONVENTIONS.md D-17 pattern).

[ASSUMED: Option B is cleaner — not explicitly decided in CONTEXT.md, but consistent with D-17 pattern]

### Defeat Flag Scope

`defeatedThisCombat` must be a module-level variable in `battleModal.js`, reset in `teardown()`, just like `postCombatPending` and `combatActive`. [VERIFIED: pattern match with existing module-level flags]

```js
let defeatedThisCombat = false; // add with other module-level state
```

Reset in `teardown()`:
```js
defeatedThisCombat = false;
```

### onModalClose Check in app.js

Current `onModalClose` in `app.js` (lines 96-100):
```js
onModalClose: () => {
    const historyContainer = document.getElementById('combat-history');
    if (currentBook && historyContainer) {
        loadCombatHistory(currentBook, historyContainer);
    }
},
```

Phase 10 needs to check the defeat flag. But `defeatedThisCombat` is a module-level variable inside `battleModal.js` — `app.js` cannot read it directly (that would be a circular/upward import).

**Resolution (locked by D-04):** `onModalCloseCallback` is already called inside `teardown()` after `defeatedThisCombat` has done its work. The flag needs to be communicated via the callback mechanism, not read directly. Two sub-options:

**Sub-option A:** `battleModal.js` calls `onModalCloseCallback(wasDefeated)` — passes a boolean argument.
**Sub-option B:** `app.js` tracks defeat separately via a closure flag set by the `onPlayerDefeated` callback it receives.

Sub-option B is cleaner and consistent with D-17 (state flows down through callbacks). The `onPlayerDefeated` callback in `app.js` (currently a no-op stub) can set a local `combatEndedInDefeat` variable. Then `onModalClose` checks that variable.

```js
// In app.js openBattleModal call:
let combatEndedInDefeat = false;

onPlayerDefeated: () => {
    combatEndedInDefeat = true;
},
onModalClose: () => {
    if (combatEndedInDefeat) {
        combatEndedInDefeat = false; // reset for next combat
        enterDeadState();
    }
    const historyContainer = document.getElementById('combat-history');
    if (currentBook && historyContainer) {
        loadCombatHistory(currentBook, historyContainer);
    }
},
```

[ASSUMED: Sub-option B (app.js closure flag) — not explicitly decided in CONTEXT.md, but avoids upward coupling and matches D-17 pattern]

### Anti-Patterns to Avoid

- **Reading battleModal.js state from app.js:** Upward coupling violates D-17. Use the callback to propagate defeat signal.
- **Calling enterDeadState() before modal teardown:** D-04 locks against this. The dead state must appear after the modal is gone.
- **Rebinding #close-battle without removing old listener:** `battle.js` already binds a click handler on `#close-battle` inside `endCombatUI`. If `onPlayerDefeated` replaces `summaryEl.innerHTML`, the old listener is removed with the old DOM. The new defeat-screen HTML should include a new `#close-battle` button and `battleModal.js` must bind it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Blocking modal dismiss after defeat | Custom dismiss logic | `postCombatPending` flag already blocks backdrop/Escape — defeat screen inherits this automatically [VERIFIED: `battleModal.js` lines 163-182] |
| Dead state persistence + UI | Custom dead-state flow | `enterDeadState()` in `app.js` already handles everything [VERIFIED: `app.js` lines 376-382] |
| Defeat stats collection | Fetching from DOM / re-running combat | Pass as arguments to `onPlayerDefeated` from `endCombatUI` |

---

## CSS Architecture

### Existing Color Palette [VERIFIED: `css/style.css` lines 10-18]

```css
:root {
    --ink-color: #2c1810;
    --ink-light: #4a3428;
    --paper-bg: #f4e4c1;
    --paper-dark: #e8d4a8;
    --accent-red: #8b2500;
    --accent-green: #5a8a3c;
}
```

### Existing Dead-State Reference Colors [VERIFIED: `css/style.css` lines 1294-1356]

```css
.dead-state__banner {
    color: var(--accent-red);                    /* #8b2500 */
    border: 3px solid var(--accent-red);
    background: rgba(139, 37, 0, 0.08);         /* very subtle red wash */
}
.mechanic-btn--danger {
    background: var(--paper-dark);
    color: var(--accent-red);
    border: 1px solid var(--accent-red);
}
```

### Existing Combat-Summary Defeat Modifier [VERIFIED: `css/style.css` lines 738-740]

```css
.combat-summary__title--defeat {
    color: var(--accent-red);
}
```

### New CSS Needed: `.battle-modal--defeat`

Applied to the `.battle-modal` (which is the `.modal` element, the card). Must:
- Override `background: var(--paper-bg)` → dark crimson background
- Set text color to light (readable on dark background)
- The existing `--accent-red: #8b2500` is a dark crimson — suitable for card background in a darker shade

Recommended approach (Claude's discretion):
```css
/* ── Battle Modal Defeat State (Phase 10) ─────────────────────────────────── */
.battle-modal--defeat {
    background: #3d0e00;           /* deep dark crimson, darker than --accent-red */
    color: #f4e4c1;                /* --paper-bg repurposed as light text */
    border: 2px solid var(--accent-red);
}

.battle-modal--defeat .modal-title {
    color: #f4e4c1;
}

.battle-modal--defeat .combat-summary__stat-label {
    color: rgba(244, 228, 193, 0.7);   /* muted light for labels */
}
```

Color rationale: `#8b2500` is the accent-red. A card background needs to be distinctly darker — `#3d0e00` (about 44% darkened) reads as deep crimson against light text at `#f4e4c1` (the paper color). The `.dead-state` uses `rgba(139, 37, 0, 0.08)` as a wash over paper — for the modal card we want a full-opacity dark version for high contrast. [ASSUMED: specific hex values — user confirmed only "dark red / dark crimson"]

### Where to Apply the Modifier

The modifier goes on `overlay.querySelector('.battle-modal')` — the same `modalEl` reference already used for `renderBattle(modalEl, ...)`. [VERIFIED: `battleModal.js` line 185]

```js
// In wrappedCallbacks.onPlayerDefeated:
const modalEl = overlayRef.querySelector('.battle-modal');
modalEl?.classList.add('battle-modal--defeat');
```

---

## Common Pitfalls

### Pitfall 1: #close-battle Button Listener Lost
**What goes wrong:** `battle.js` `endCombatUI` binds a click listener on `#close-battle` inside `summaryEl`. If `onPlayerDefeated` replaces `summaryEl.innerHTML`, that listener is destroyed with the old DOM node. The new defeat-screen HTML's `#close-battle` button has no listener.
**Why it happens:** `battle.js` already rendered the summary before firing `onPlayerDefeated`. The defeat screen replaces that summary. The replacement happens after the `battle.js` listener is bound.
**How to avoid:** After replacing `summaryEl.innerHTML` in `battleModal.js`'s `onPlayerDefeated`, bind a new click listener on the new `#close-battle` element:
```js
summaryEl.querySelector('#close-battle')?.addEventListener('click', () => {
    wrappedCallbacks.onClose?.();
});
```
**Warning signs:** Clicking "Return to Sheet" does nothing; modal stays open after defeat.

### Pitfall 2: defeatedThisCombat Not Reset Between Combats
**What goes wrong:** Player opens a second combat after dying/restarting — `defeatedThisCombat` is still `true` from the previous fight.
**Why it happens:** Module-level state persists for the session lifetime; `teardown()` must reset all flags.
**How to avoid:** Reset `defeatedThisCombat = false` in `teardown()` alongside `postCombatPending = false` and `combatActive = false`. Also reset `combatEndedInDefeat` in `app.js` after checking it.

### Pitfall 3: enterDeadState() Called While Modal Still Visible
**What goes wrong:** Dead state UI renders under the still-open modal; player sees a flash or inconsistent state.
**Why it happens:** Calling `enterDeadState()` in `onPlayerDefeated` directly (before the modal closes).
**How to avoid:** D-04 explicitly locks this — call `enterDeadState()` only inside `onModalClose`, which fires after `teardown()` completes.

### Pitfall 4: overlayRef Null in onPlayerDefeated
**What goes wrong:** `overlayRef.querySelector('.battle-modal')` throws because `overlayRef` is null.
**Why it happens:** Defensive: `overlayRef` is set before `renderBattle` runs, so it should always be set when `onPlayerDefeated` fires. But null-guarding is still good practice.
**How to avoid:** Use optional chaining: `overlayRef?.querySelector('.battle-modal')?.classList.add(...)`.

---

## Code Examples

### Defeat Screen HTML Template

```js
// Source: pattern matches renderSummaryHTML in battle.js (lines 130-156) [VERIFIED]
function renderDefeatScreenHTML(rounds, playerStaminaFinal, playerStaminaInitial, enemy) {
    return `
        <div class="combat-summary">
            <div class="combat-summary__title combat-summary__title--defeat">
                YOU WERE DEFEATED
            </div>
            <div class="combat-summary__stats">
                <div>
                    <span class="combat-summary__stat-label">Rounds</span>
                    ${rounds}
                </div>
                <div>
                    <span class="combat-summary__stat-label">Your Stamina</span>
                    ${playerStaminaFinal}/${playerStaminaInitial}
                </div>
                <div>
                    <span class="combat-summary__stat-label">${enemy.name}</span>
                    ${enemy.stamina}/${enemy.staminaInitial}
                </div>
            </div>
            <button class="mechanic-btn mechanic-btn--primary" id="close-battle">Return to Sheet</button>
        </div>
    `;
}
```

Note: This is the same structure as `renderSummaryHTML` but with the heading "YOU WERE DEFEATED" rather than "Defeated". The modal card background handles the dark theming — the summary content inside stays consistent.

### wrappedCallbacks.onPlayerDefeated Implementation

```js
// In battleModal.js wrappedCallbacks, replacing the Phase 9 stub:
onPlayerDefeated: (rounds, playerStaminaFinal, enemy) => {
    defeatedThisCombat = true;

    // Apply dark card modifier
    const modalEl = overlayRef?.querySelector('.battle-modal');
    modalEl?.classList.add('battle-modal--defeat');

    // Replace summary content with defeat screen
    const summaryEl = overlayRef?.querySelector('#combat-summary');
    if (summaryEl) {
        const { state } = getState();
        summaryEl.innerHTML = renderDefeatScreenHTML(
            rounds,
            playerStaminaFinal,
            state.stamina.initial,
            enemy
        );
        // Re-bind close button (old listener is gone with replaced DOM)
        summaryEl.querySelector('#close-battle')?.addEventListener('click', () => {
            wrappedCallbacks.onClose?.();
        });
    }

    // Propagate to app.js (for combatEndedInDefeat flag)
    callbacks.onPlayerDefeated?.();
},
```

### battle.js endCombatUI — onPlayerDefeated Call with Arguments

```js
// battle.js endCombatUI (line 312-314), minimal change:
if (winner === 'enemy') {
    callbacks.onPlayerDefeated?.(round, playerStaminaFinal, enemy);
}
```

### app.js — onModalClose with Defeat Gate

```js
// In app.js, inside openBattleModal call — replace the current stub and onModalClose:
let combatEndedInDefeat = false;

// ...inside callbacks object:
onPlayerDefeated: () => {
    combatEndedInDefeat = true;
},
onModalClose: () => {
    if (combatEndedInDefeat) {
        combatEndedInDefeat = false;
        enterDeadState();
    }
    const historyContainer = document.getElementById('combat-history');
    if (currentBook && historyContainer) {
        loadCombatHistory(currentBook, historyContainer);
    }
},
```

---

## Runtime State Inventory

Step 2.5 SKIPPED — This is not a rename/refactor/migration phase.

---

## Environment Availability

Step 2.6 SKIPPED — No external dependencies. This phase touches only JS and CSS files served statically by the existing uvicorn server. No new tools, services, or runtimes required.

---

## Validation Architecture

`nyquist_validation: false` in `.planning/config.json` — this section is skipped per configuration.

---

## Security Domain

This phase adds no authentication, data handling, input processing, or cryptography. No ASVS categories apply to defeat-screen UI rendering. Security domain not applicable.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pass rounds/playerStaminaFinal/enemy as arguments to onPlayerDefeated (Option B) — requires one-line change in battle.js | Architecture Patterns: Data Availability | Low — Option A (getState() lookup) is the safe fallback; both work |
| A2 | combatEndedInDefeat closure flag in app.js (Sub-option B) — app.js tracks defeat, not battleModal.js | Architecture Patterns: onModalClose Check | Low — alternative is passing wasDefeated arg to onModalCloseCallback; both work |
| A3 | Dark card background `#3d0e00` — specific hex value for `.battle-modal--defeat` | CSS Architecture | Low cosmetic risk — user discretion was delegated to Claude; can be adjusted in review |

---

## Open Questions

1. **Should the modal-title "Combat" heading stay visible during the defeat screen?**
   - What we know: D-01 mockup does not show a "Combat" header — the card shows only the defeat content. The `.modal-title` with "Combat" is rendered in the modal HTML and not hidden.
   - What's unclear: Whether the title should be hidden in defeat mode.
   - Recommendation: Hide `.modal-title` when `.battle-modal--defeat` is applied, via CSS: `.battle-modal--defeat .modal-title { display: none; }`. This matches the D-01 mockup more closely. Alternatively, change the title text via JS. Either is low-risk.

---

## Sources

### Primary (HIGH confidence)
- `/home/claude/ffconsole/js/ui/battleModal.js` — full file inspection: wrappedCallbacks structure, module-level flags, teardown flow, overlayRef
- `/home/claude/ffconsole/js/ui/battle.js` (lines 130-315) — renderSummaryHTML, endCombatUI, onPlayerDefeated call site
- `/home/claude/ffconsole/js/app.js` (lines 1-112, 372-410) — onPlayerDefeated stub, enterDeadState(), onModalClose
- `/home/claude/ffconsole/css/style.css` (lines 1-19, 337-354, 716-760, 1294-1370) — CSS variables, .modal, .combat-summary, .dead-state

### Secondary (MEDIUM confidence)
- `.planning/codebase/CONVENTIONS.md` — D-17 pattern, BEM naming, no circular imports, innerHTML templating

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pure vanilla JS, no new dependencies, all patterns verified in codebase
- Architecture: HIGH — signal flow verified from battle.js through battleModal.js to app.js; only implementation details are ASSUMED
- CSS: MEDIUM — existing variables and patterns verified; specific dark-red hex value is Claude's discretion (ASSUMED)
- Pitfalls: HIGH — all identified from direct code inspection of the existing event binding / flag patterns

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable codebase, no fast-moving deps)
