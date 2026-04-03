# Phase 8: Post-Combat Flow and History - Research

**Researched:** 2026-04-03
**Domain:** Vanilla JS modal state machine, callback wiring, DOM event lifecycle
**Confidence:** HIGH

## Summary

Phase 8 is a self-contained UI wiring task within a well-understood codebase. The entire implementation lives in three files: `js/ui/battle.js`, `js/ui/battleModal.js`, and `js/app.js`. No new libraries, build steps, or backend changes are needed. All four requirements (MODAL-06 through MODAL-09) can be satisfied by adding one new state flag to `battleModal.js`, threading two callbacks through the existing callback object, and replacing the "New Battle" button in the post-combat summary with a "Close" button.

The key design constraint is the circular-import prohibition (D-17): `battle.js` cannot import `battleModal.js` and vice versa. Callbacks are the established pattern for cross-module communication in this codebase (every existing interaction uses them), so the solution is callback-driven throughout.

The `combat-summary` container and `mechanic-btn--primary` CSS class already exist and are styled correctly. No new CSS is required for the Close button.

**Primary recommendation:** Introduce a `postCombatPending` flag in `battleModal.js` (set when `onCombatStateChange(false)` fires), add an `onClose` callback that `battle.js` invokes from the Close button, and add an `onModalClose` callback that `app.js` passes to trigger history refresh after teardown.

---

## Standard Stack

No new dependencies. All work uses existing modules.

| Module | Role in this phase |
|--------|--------------------|
| `js/ui/battle.js` | Replace "New Battle" button with "Close" button; call `callbacks.onClose?.()` |
| `js/ui/battleModal.js` | Add `postCombatPending` flag; block dismiss guard during post-combat; call `onModalClose` in `teardown()` |
| `js/app.js` | Pass `onModalClose` callback to `openBattleModal`; no structural changes |
| `css/style.css` | No changes needed (existing classes cover the Close button) |

---

## Architecture Patterns

### Existing Pattern: Callback-Threaded Cross-Module Communication

The codebase already uses this pattern everywhere:
- `renderBattle(container, getState, callbacks)` — all battle-to-app communication goes through `callbacks`
- `wrappedCallbacks` in `battleModal.js` — already intercepts `onCombatStateChange` to set local `combatActive`
- `showCharCreate({ onComplete })` in `charCreate.js` — same pattern

This is the canonical pattern for this codebase. New callbacks follow the same shape.

### Existing Pattern: Module-Level State in battleModal.js

`battleModal.js` already maintains module-level vars (`savedScroll`, `combatActive`, `escHandler`, `overlayRef`). Adding `postCombatPending` follows this established pattern. Adding `onModalCloseCallback` as a module-level var (set during `openBattleModal`) is also consistent.

---

## Design Questions — Recommended Approaches

### Q1: Post-Combat Dismiss Guard

**Problem:** After combat ends, `endCombatUI` calls `onCombatStateChange(false)`, which sets `combatActive = false` in `battleModal.js`. This allows backdrop click and Escape to dismiss the modal while the player is still reading the summary. The player should only be able to dismiss via the explicit Close button.

**Recommended approach: Add `postCombatPending` flag.**

In `battleModal.js`:
```javascript
// Module-level state
let savedScroll = 0;
let combatActive = false;
let postCombatPending = false;  // NEW
let escHandler = null;
let overlayRef = null;
```

In `wrappedCallbacks.onCombatStateChange`:
```javascript
onCombatStateChange: (active) => {
    if (combatActive && !active) {
        // A fight just ended — block accidental dismiss
        postCombatPending = true;
    }
    combatActive = active;
    callbacks.onCombatStateChange?.(active);
}
```

In the dismiss guard (both Escape and backdrop click):
```javascript
if (combatActive || postCombatPending) {
    triggerShake(overlay);
} else {
    closeBattleModal();
}
```

`postCombatPending` is cleared to `false` in `teardown()` (already resets `combatActive = false`).

**Why not the alternatives:**

- "Keep `combatActive = true` until Close is clicked": This misrepresents state — `combatActive` is read by `app.js` via `onCombatStateChange` to track whether a fight is in progress. Holding it `true` after the fight ends would corrupt `combatState.active` in `app.js`.
- "Intercept `onCombatEnd` to set post-combat state": `onCombatEnd` fires in `battle.js` at the same time as `onCombatStateChange(false)`, but `onCombatEnd` is already used by `app.js` to do `combatState.active = false`. Two callbacks firing simultaneously for the same purpose is redundant — a single `onCombatStateChange` interception is cleaner.

**Risk:** LOW. `postCombatPending` is a simple boolean with one write path and one reset path. The transition `combatActive: true → false` only happens once per fight, so the `if (combatActive && !active)` guard can never fire spuriously.

**Edge case:** Opening a new modal session immediately after closing without a fight started (e.g., player opens modal, closes without starting combat). In that case `combatActive` was never set to `true`, so `postCombatPending` is never set. Correct behavior — no block needed.

---

### Q2: Close Button Wiring

**Problem:** The Close button rendered by `battle.js` (inside `renderSummaryHTML`) needs to call `closeBattleModal()`, but `battle.js` cannot import `battleModal.js`.

**Recommended approach: Add `onClose` to the callbacks object.**

In `battleModal.js`, extend `wrappedCallbacks`:
```javascript
const wrappedCallbacks = {
    ...callbacks,
    onCombatStateChange: (active) => { /* as above */ },
    onClose: () => {
        postCombatPending = false;
        closeBattleModal();
    }
};
```

In `battle.js`, `renderSummaryHTML` changes the button:
```javascript
// Was:
<button class="mechanic-btn" id="new-battle">New Battle</button>

// Becomes:
<button class="mechanic-btn mechanic-btn--primary" id="close-battle">Return to Sheet</button>
```

In `endCombatUI` (inside `battle.js`), bind the new button:
```javascript
const closeBattleBtn = summaryEl.querySelector('#close-battle');
if (closeBattleBtn) {
    closeBattleBtn.addEventListener('click', () => {
        callbacks.onClose?.();
    });
}
```

The existing "New Battle" button binding is removed. The New Battle flow no longer makes sense inside the modal — the player dismisses the modal, then taps "Start Battle" again from the sheet.

**Why not inject `closeBattleModal` directly as a named function reference:** There is no mechanism to do this without either importing `battleModal.js` into `battle.js` (forbidden) or passing it as a standalone argument to `renderBattle`. Using the existing callbacks object is the established pattern and avoids API surface changes to `renderBattle`.

**Risk:** LOW. The `callbacks.onClose?.()` optional-chain call means that if a caller passes no `onClose`, the button click is a no-op rather than an error. The existing standalone (non-modal) `renderBattle` usage would need `onClose` added if it exists, but inspection shows `renderBattle` is only called from `battleModal.js`.

---

### Q3: History Refresh After Close

**Problem:** `loadCombatHistory` must be called AFTER modal teardown completes (DOM removal, scroll restore), not before. Calling it before teardown risks a flash of the sheet updating while the modal is still fading out.

**Recommended approach: Add `onModalClose` callback stored at module level in `battleModal.js`, called at the end of `teardown()`.**

In `battleModal.js`, add a module-level var:
```javascript
let onModalCloseCallback = null;
```

In `openBattleModal`, capture it:
```javascript
export function openBattleModal(getState, callbacks) {
    onModalCloseCallback = callbacks.onModalClose ?? null;
    // ... rest of existing code
}
```

In `teardown()`:
```javascript
function teardown(overlay) {
    overlay.remove();
    document.body.style.cssText = '';
    window.scrollTo(0, savedScroll);
    overlayRef = null;
    combatActive = false;
    postCombatPending = false;

    document.getElementById('start-battle-btn')?.focus();

    // Fire AFTER DOM cleanup and focus restoration
    onModalCloseCallback?.();
    onModalCloseCallback = null;  // prevent double-fire
}
```

In `app.js`, add to the `openBattleModal` call:
```javascript
openBattleModal(
    () => ({ state, combatState, currentBook }),
    {
        onStart: startCombat,
        onRollRound: rollCombatRound,
        onFlee: endCombat,
        onEnd: endCombat,
        onStatSync: syncStateFromServer,
        onCombatEnd: () => { combatState.active = false; },
        onTestLuck: (bookNumber, luckCurrent, round, context, damageBefore) =>
            testCombatLuck(bookNumber, luckCurrent, round, context, damageBefore),
        onCombatStateChange: (active) => { combatState.active = active; },
        onModalClose: () => {              // NEW
            const historyContainer = document.getElementById('combat-history');
            if (currentBook && historyContainer) {
                loadCombatHistory(currentBook, historyContainer);
            }
        }
    }
);
```

**Why call `onModalClose` after `document.getElementById('start-battle-btn')?.focus()` but before returning from `teardown`:** Focus restoration happens synchronously; the history fetch is async and fires independently. Order does not matter between these two, but placing the callback last keeps teardown a clean rollback sequence followed by side effects.

**Why null-assign after firing:** Prevents a stale callback being called if `closeBattleModal` is somehow invoked twice (e.g., a race between the animationend listener and a forced close). Belt-and-suspenders.

**Risk:** LOW. The history refresh is already marked "fails silently" in the code (`loadCombatHistory` has a try/catch that clears the container on error). Even if called at a bad time it does no harm.

**Edge case:** Player opens the modal, never starts a fight, closes via backdrop/Escape. `onModalClose` fires but `loadCombatHistory` is called — this is harmless, it simply re-renders the same history. If you want to avoid an unnecessary fetch, the callback can check whether a fight actually happened, but this is not worth the complexity given the call is cheap.

---

### Q4: CSS for the Close Button

**Verified by direct inspection of `css/style.css`:**

The existing `.mechanic-btn` and `.mechanic-btn--primary` classes are fully sufficient:
- `.mechanic-btn`: MedievalSharp font, 10px/14px padding, border, touch-action: manipulation, tap highlight suppression. Correct for any action button in the modal.
- `.mechanic-btn--primary`: Dark background, light text. Used for "Start Combat" and "Roll Round" — appropriate for the primary action button in the summary.

The `combat-summary` container already has `text-align: center` and the responsive rule at `@media (max-width: 480px)` already sets `.mechanic-btn { width: 100% }` inside the combat summary.

**Recommended button markup:**
```html
<button class="mechanic-btn mechanic-btn--primary" id="close-battle">Return to Sheet</button>
```

No new CSS classes are needed. This button will inherit full-width on mobile from the existing responsive rule.

**Note on "combat-summary__title--defeat":** The CSS has `--defeat` but `renderSummaryHTML` in `battle.js` passes `winner === 'enemy' ? 'Defeated'` and uses class `combat-summary__title--enemy`. Verify the modifier class name matches the CSS (`--defeat` in CSS vs `--enemy` in JS). This is a pre-existing latent bug that Phase 8 should not introduce, but the planner should note it for a 1-line fix.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Cross-module function calls without import | Custom event bus, global registry | Callback object (existing pattern) |
| Post-animation side effects | `setTimeout` with guessed delay | `animationend` listener (already used in `closeBattleModal`) |
| History refresh timing | Manual delay before refresh | Call in `teardown()` after DOM removal (synchronous ordering) |

---

## Common Pitfalls

### Pitfall 1: Clearing `postCombatPending` Too Early
**What goes wrong:** If `postCombatPending = false` is set before `teardown()` completes (e.g., in the `onClose` callback), then the `animationend`-driven teardown path has nothing to block a second dismiss if it fires. But `closeBattleModal` already nulls `escHandler` before starting the animation, so this is not a real risk — there is no second dismiss path active during animation.

**Prevention:** Clear `postCombatPending` inside `teardown()`, not in `onClose`. The `onClose` callback should only call `closeBattleModal()`, which will eventually call `teardown()`.

### Pitfall 2: Double-Firing `onModalClose`
**What goes wrong:** If `closeBattleModal()` is called while a fade-out animation is already in progress, a second `animationend` listener fires and `teardown()` runs twice.

**Prevention:** `closeBattleModal` already guards with `if (!overlay) return` and clears `escHandler` before starting the animation. The `{ once: true }` option on the `animationend` listener prevents double-fire. Setting `onModalCloseCallback = null` after the first call adds a final safeguard.

### Pitfall 3: History Refresh Before Fight Data Is Persisted
**What goes wrong:** `onModalClose` fires immediately after teardown. If the `onEnd`/`onFlee` backend writes are still in-flight, `loadCombatHistory` fetches stale data.

**What the code actually does:** `endCombatUI` is only called AFTER `await callbacks.onEnd(...)` or `await callbacks.onFlee(...)` complete (the `await` is in the click handlers of `rollRoundBtn` and `fleeBtn`). By the time the player taps "Return to Sheet" and `closeBattleModal` fires, the combat-end API call has already resolved. This is safe.

**Risk level:** LOW — the `await` ordering in `battle.js` already serializes writes before the summary renders.

### Pitfall 4: `combat-summary__title--enemy` vs `--defeat` CSS Mismatch
**What goes wrong:** The CSS defines `.combat-summary__title--defeat` and `.combat-summary__title--fled`, but `renderSummaryHTML` in `battle.js` uses `combat-summary__title--${winner}` where `winner` is `'player'`, `'enemy'`, or `'fled'`. The `'enemy'` value produces `--enemy`, which has no CSS rule. The enemy-win title renders unstyled (no red color).

**This is a pre-existing bug.** Phase 8 changes `renderSummaryHTML` to replace the "New Battle" button, so the fix is trivially adjacent: change the `--enemy` → `--defeat` reference in the template string, or add a `.combat-summary__title--enemy` CSS rule. Recommend fixing in the same task.

### Pitfall 5: `renderBattle` Called Outside Modal Context
**What goes wrong:** If `renderBattle` is ever called outside `battleModal.js` (directly, with no `onClose` in callbacks), the Close button's `callbacks.onClose?.()` is a no-op — the button does nothing.

**Current state:** `renderBattle` is only called from `battleModal.js` (line 172). The standalone mode using `#combat-section` from earlier phases was replaced. No risk currently, but the `?.()` optional chain handles this gracefully.

---

## Code Examples

### New `wrappedCallbacks` in `battleModal.js`
```javascript
// Source: direct analysis of battleModal.js lines 136-142 + proposed addition
const wrappedCallbacks = {
    ...callbacks,
    onCombatStateChange: (active) => {
        if (combatActive && !active) {
            postCombatPending = true;
        }
        combatActive = active;
        callbacks.onCombatStateChange?.(active);
    },
    onClose: () => {
        postCombatPending = false;
        closeBattleModal();
    }
};
```

### Updated dismiss guard (both locations in `battleModal.js`)
```javascript
// Replace: if (combatActive) { triggerShake... } else { closeBattleModal... }
// With:
if (combatActive || postCombatPending) {
    triggerShake(overlay);
} else {
    closeBattleModal();
}
```

### Updated `teardown()` in `battleModal.js`
```javascript
function teardown(overlay) {
    overlay.remove();
    document.body.style.cssText = '';
    window.scrollTo(0, savedScroll);
    overlayRef = null;
    combatActive = false;
    postCombatPending = false;

    document.getElementById('start-battle-btn')?.focus();

    onModalCloseCallback?.();
    onModalCloseCallback = null;
}
```

### Replacement button in `renderSummaryHTML` (`battle.js`)
```javascript
// Remove: <button class="mechanic-btn" id="new-battle">New Battle</button>
// Add:
<button class="mechanic-btn mechanic-btn--primary" id="close-battle">Return to Sheet</button>
```

### Updated `endCombatUI` button binding (`battle.js`)
```javascript
// Remove newBattleBtn binding entirely.
// Add:
const closeBattleBtn = summaryEl.querySelector('#close-battle');
if (closeBattleBtn) {
    closeBattleBtn.addEventListener('click', () => {
        callbacks.onClose?.();
    });
}
```

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure JS wiring within existing modules).

---

## Open Questions

1. **"New Battle" button removal vs. replacement**
   - What we know: The current "New Battle" button resets the combat setup form and hides the summary, allowing another fight without closing the modal.
   - What's unclear: Is the "fight again without closing" flow wanted by the user? The phase requirements say MODAL-07 is the only dismiss path after combat ends. But a player might want to fight the same enemy again (or a different one) without going back to the sheet.
   - Recommendation: Remove "New Battle" per the requirements as stated. If the user wants to re-fight, they tap "Start Battle" again from the sheet. This is simpler and consistent with MODAL-07. Flag this to the planner for user confirmation if desired.

2. **`combat-summary__title--defeat` vs `--enemy` class mismatch**
   - What we know: CSS has `--defeat`, JS generates `--enemy`. Red color is not applied on player defeat.
   - What's unclear: Whether this was intentional (some earlier phase may have used different terminology).
   - Recommendation: Fix in the same wave as `renderSummaryHTML` is touched. Either add `.combat-summary__title--enemy` to CSS or change the JS template to map `'enemy'` → `'defeat'`.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `js/ui/battle.js` (full file, 624 lines) — `renderSummaryHTML`, `endCombatUI`, callback contract
- Direct code inspection: `js/ui/battleModal.js` (full file, 198 lines) — `teardown`, dismiss guard, `wrappedCallbacks` pattern
- Direct code inspection: `js/app.js` (full file, 498 lines) — `openBattleModal` call site, `loadCombatHistory` usage
- Direct code inspection: `css/style.css` — `.mechanic-btn`, `.mechanic-btn--primary`, `.combat-summary` verified present
- Direct code inspection: `index.html` — `#combat-history` placement confirmed outside modal

### Secondary (MEDIUM confidence)
- None needed — all findings are from direct code inspection.

---

## Metadata

**Confidence breakdown:**
- Design approach for Q1 (dismiss guard): HIGH — code logic is deterministic, flag transitions are simple
- Design approach for Q2 (Close callback): HIGH — established pattern in this codebase, no ambiguity
- Design approach for Q3 (history refresh): HIGH — `teardown()` lifecycle is clear, `await` ordering already serializes writes
- CSS assessment (Q4): HIGH — verified by direct inspection of `style.css`
- Pre-existing `--defeat`/`--enemy` bug: HIGH — confirmed by reading both files

**Research date:** 2026-04-03
**Valid until:** Indefinitely (no external dependencies; all findings from codebase inspection)
