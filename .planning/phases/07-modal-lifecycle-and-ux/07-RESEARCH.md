# Phase 7: Modal Lifecycle and UX — Research

**Researched:** 2026-04-03
**Domain:** Vanilla JS modal lifecycle — CSS animations, iOS Safari scroll lock, focus management, dismiss guards
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (combatActive signal):** Add `onCombatStateChange(active)` to the existing `callbacks` object passed to `renderBattle()`. `battleModal.js` flips a local boolean flag when this callback fires. When the flag is `true`, Escape and backdrop-tap are blocked.
- **D-02 (dismiss guard):** When Escape or backdrop is tapped during active combat, play a subtle shake animation (CSS keyframe, ~300ms). No text, no sound — purely physical feedback. When combat is NOT active (setup form), Escape and backdrop close normally.
- **D-03 (scroll lock):** Use `position:fixed` + saved `scrollY` technique:
  - On open: `savedScroll = window.scrollY`, then `document.body.style.cssText = 'position:fixed; top:-${savedScroll}px; width:100%;'`
  - On close: clear body inline styles, `window.scrollTo(0, savedScroll)`
- **D-04 (animation):** Slide up from bottom on open, fade out on close. Duration: 300ms for both. Easing: Claude's discretion.
- **D-05 (reduced motion):** When `prefers-reduced-motion: reduce` is set, skip all animations — modal appears/disappears instantly, no shake.
- **D-06 (focus management):** On open, focus moves to `#enemy-name`. Use `requestAnimationFrame` after `appendChild` to ensure the element is in DOM before focusing.

### Claude's Discretion

- Exact easing curves for slide-up and fade-out (ease-out/ease-in conventional)
- Whether shake animation is also applied on non-combat Escape attempts (no — free dismiss when setup is showing)
- CSS keyframe timing for shake (3–4 rapid translate offsets, ~300ms total)

### Deferred Ideas (OUT OF SCOPE)

- Full Tab trap, `aria-modal`, `inert` on background sheet (accessibility — deferred to Future Requirements)
- MODAL-06, MODAL-07, MODAL-08, MODAL-09 (Phase 8 — post-combat summary and history refresh)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODAL-04 | Full round-by-round combat (roll, luck prompts, stamina bars, flee) runs inside the modal | `renderBattle()` is already container-scoped (Phase 6). `battleModal.js` calls it with the `.battle-modal` div. No new wiring needed beyond the `onCombatStateChange` callback. |
| MODAL-05 | Modal cannot be accidentally dismissed during active combat (backdrop tap and Escape are no-ops while fight is in progress) | `combatActive` boolean in `battleModal.js` driven by `onCombatStateChange` callback; Escape handler added on open/removed on close. |
| MODAL-10 | Modal slides up from bottom on open and fades out on close; respects `prefers-reduced-motion` | CSS-only `@keyframes` with modifier classes `.modal-overlay--opening` / `.modal-overlay--closing`; `@media (prefers-reduced-motion: reduce)` block. |
| MODAL-11 | Body scroll is locked while modal is open; restored on close (iOS Safari safe) | `position:fixed` + saved `scrollY` technique (D-03). Module-level `savedScroll` variable survives between open/close calls. |
| MODAL-12 | Focus moves into the modal on open (to first interactive element) | `requestAnimationFrame(() => overlay.querySelector('#enemy-name').focus())` after `appendChild`. On close, return focus to `#start-battle-btn`. |
</phase_requirements>

---

## Summary

Phase 7 is a pure UX polish phase on top of the already-working modal shell created in Phase 6. The `openBattleModal()` function is fully built; `closeBattleModal()` is an empty stub. Phase 7 fills in the teardown half and adds: animation, scroll lock, focus management, and the dismiss guard.

All implementation is vanilla JS + CSS. No new dependencies. The decisions are fully locked in CONTEXT.md and the UI-SPEC — there are no architecture choices left to make, only execution details to get right.

The main integration challenge is threading `onCombatStateChange` through `battle.js` to `battleModal.js`. The state machine in `battle.js` has two transition points that need the callback: `combatActive = true` at start-combat (line 330) and `combatActive = false` inside `endCombatUI()` (line 291). Both need the callback fired immediately after the flag is set.

**Primary recommendation:** Implement in three discrete chunks — (1) scroll lock + focus + animation in `battleModal.js`, (2) add `onCombatStateChange` callback to `battle.js`, (3) add CSS keyframes and modifier classes to `style.css`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES2022+ (no version) | All modal logic | Project constraint — no JS libraries |
| CSS3 `@keyframes` | Browser native | All animations | Project constraint — no animation libraries |

No new packages. No installation required.

---

## Architecture Patterns

### Current Module Structure

```
js/ui/
├── battleModal.js   # open/close lifecycle — Phase 7 implements close + adds scroll lock, animation, focus, dismiss guard
├── battle.js        # combat UI — add onCombatStateChange callback at 2 transition points
css/
└── style.css        # add @keyframes, modifier classes, reduced-motion block
```

### Pattern 1: Create-on-open / Destroy-on-close

**What:** Overlay element created fresh in `openBattleModal()`, removed from DOM in `closeBattleModal()`.

**Why it matters for Phase 7:** The `closeBattleModal()` stub is currently empty. The correct teardown sequence is:
1. Add `.modal-overlay--closing` class to trigger fade-out animation
2. Listen for `animationend` event on the overlay
3. Inside the `animationend` handler: clear body scroll-lock styles, `window.scrollTo(0, savedScroll)`, `overlay.remove()`, return focus to `#start-battle-btn`
4. Handle reduced-motion case: skip animation, do teardown synchronously

The `animationend` approach is critical — removing the overlay synchronously would cause a visual flash where the element disappears before the fade completes.

**Reference:** `charCreate.js` uses `overlay.remove()` as the teardown. Phase 7 extends this with the animation wait and scroll restore.

### Pattern 2: Scoped Escape Handler (add on open, remove on close)

**What:** `document.addEventListener('keydown', escHandler)` added inside `openBattleModal()`, removed inside `closeBattleModal()`.

**Why not a permanent global handler:** Avoids listener stacking if the modal is opened multiple times. The existing pattern at `app.js:440–445` is a permanent global listener for the book modal — this is fine for a singleton that always exists, but the battle modal is destroyed on close, so a scoped handler is cleaner.

**Implementation note:** The handler function must be stored in a module-level variable (or closure) so the same reference can be passed to `removeEventListener`.

```javascript
// Source: established pattern from js/app.js:440-445 (adapted for scoped lifecycle)
let escHandler = null;

export function openBattleModal(getState, callbacks) {
    // ...create overlay...
    escHandler = (e) => {
        if (e.key !== 'Escape') return;
        if (combatActive) {
            triggerShake(overlay);
        } else {
            closeBattleModal();
        }
    };
    document.addEventListener('keydown', escHandler);
}

export function closeBattleModal() {
    document.removeEventListener('keydown', escHandler);
    escHandler = null;
    // ...teardown...
}
```

### Pattern 3: combatActive Signal via Callback

**What:** `battle.js` calls `callbacks.onCombatStateChange(true/false)` at the two state transition points. `battleModal.js` maintains `let combatActive = false` and updates it from the callback.

**Two transition points in battle.js:**
- Line 330 area: `combatActive = true` (inside `startBtn` click handler, after setting local state)
- Line 291 area: `combatActive = false` (inside `endCombatUI()`, after setting local state)

**Important:** The callback must be called AFTER the local `combatActive` assignment in `battle.js`, and the `battleModal.js` variable must be set inside the callback. There is no race condition since this is all synchronous.

**Backward compatibility:** `battle.js:renderBattle()` currently documents `callbacks` as `{ onStart, onRollRound, onFlee, onEnd, onStatSync, onCombatEnd, onTestLuck }`. Adding `onCombatStateChange` is additive and non-breaking. In `app.js`, the callbacks object construction just needs the new key added; if the key is missing and `battle.js` guards with `callbacks.onCombatStateChange?.()`, old callers won't break.

### Pattern 4: Animation via Modifier Classes

**What:** CSS classes added/removed by JS trigger `@keyframes` animations. JS never directly sets `animation` styles.

**Three modifier classes (per UI-SPEC):**

| Class | Applied to | Keyframe | Trigger |
|-------|------------|---------|---------|
| `.modal-overlay--opening` | `overlay` | `modal-slide-up` on `.modal` child | Added in `openBattleModal()`, removed on `animationend` |
| `.modal-overlay--closing` | `overlay` | `modal-fade-out` on overlay | Added in `closeBattleModal()`, overlay removed on `animationend` |
| `.modal--shake` | `.modal` inner box | `modal-shake` | Added on blocked dismiss attempt, removed on `animationend` |

**Shake re-triggering:** The shake class must be removed after `animationend` so that subsequent blocked attempts re-trigger the animation. The pattern is:

```javascript
function triggerShake(overlay) {
    const modal = overlay.querySelector('.modal');
    if (!modal) return;
    modal.classList.remove('modal--shake');
    // Force reflow to allow re-triggering the same animation
    void modal.offsetWidth;
    modal.classList.add('modal--shake');
    modal.addEventListener('animationend', () => {
        modal.classList.remove('modal--shake');
    }, { once: true });
}
```

The `void modal.offsetWidth` reflow trick is required — without it, removing and immediately re-adding a class in the same JS tick does not re-trigger the animation.

### Pattern 5: iOS Safari Scroll Lock

**What:** `position:fixed` technique prevents iOS Safari's rubber-band scroll from bleeding through to background content.

**Critical detail:** `savedScroll` must be a **module-level variable** in `battleModal.js`, not a local variable inside `openBattleModal()`. The `closeBattleModal()` function is a separate call and cannot access a local variable from the open call's closure (since they are separate function invocations, not nested).

```javascript
// Module-level — survives between open and close calls
let savedScroll = 0;

export function openBattleModal(...) {
    savedScroll = window.scrollY;
    document.body.style.cssText = `position:fixed; top:-${savedScroll}px; width:100%;`;
    // ...
}

export function closeBattleModal() {
    document.body.style.cssText = '';
    window.scrollTo(0, savedScroll);
    // ...
}
```

**Why `cssText` instead of individual style properties:** Using `cssText` ensures a single clean assignment that sets exactly these three properties. Individual `style.position = 'fixed'` etc. accumulates with any existing inline styles. The close side clears the entire `cssText` which is safe because `battleModal.js` is the only code setting body inline styles.

### Anti-Patterns to Avoid

- **Removing overlay synchronously on close:** Causes visual flash before fade completes. Always wait for `animationend`.
- **Not handling the reduced-motion case:** If animation is `none`, `animationend` never fires. Must check `prefers-reduced-motion` before deciding whether to wait for `animationend` or tear down synchronously.
- **Storing `savedScroll` as a local variable:** `closeBattleModal()` won't have access. Must be module-level.
- **Using `overlay.style.display = 'none'` for close:** Conflicts with the `.modal-overlay.active` display pattern already in CSS. Use class removal + `overlay.remove()` instead.
- **Global Escape handler without cleanup:** Leads to stacked listeners on repeated open/close cycles. Scope the listener to the modal's open lifetime.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS animation timing | setTimeout-based delay for close | CSS `animationend` event | Browser fires this reliably; setTimeout is a guess |
| Re-triggering same animation | Toggle class without reflow | `void el.offsetWidth` before re-adding class | Without reflow, browser optimizes away the re-trigger |
| Reduced-motion detection | JS `window.matchMedia` in every handler | CSS `@media (prefers-reduced-motion: reduce)` block | One CSS block handles all cases; no JS branching needed |

---

## Common Pitfalls

### Pitfall 1: animationend Never Fires When Animation is Skipped

**What goes wrong:** The close flow adds `.modal-overlay--closing` and waits for `animationend` before calling `overlay.remove()`. But `prefers-reduced-motion: reduce` sets `animation: none` on the overlay, so `animationend` never fires — the modal never closes.

**Why it happens:** `animationend` is only dispatched when a CSS animation actually runs to completion. `animation: none` suppresses both the animation and the event.

**How to avoid:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in `closeBattleModal()`. If true, skip the animation class and proceed directly to teardown.

```javascript
export function closeBattleModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (!overlay) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
        teardown(overlay);
        return;
    }

    overlay.classList.add('modal-overlay--closing');
    overlay.addEventListener('animationend', () => teardown(overlay), { once: true });
}
```

### Pitfall 2: Shake Animation Won't Re-trigger

**What goes wrong:** Player hits Escape three times. First shake plays. Second and third attempts do nothing.

**Why it happens:** The browser sees `.modal--shake` is already present and skips re-triggering. Removing and re-adding the class in the same JS tick (no reflow between) doesn't reset the animation state.

**How to avoid:** Force a reflow between remove and add: `void modal.offsetWidth`.

**Warning signs:** Shake works on first attempt, silently fails on repeat. Always test with rapid repeat key presses.

### Pitfall 3: scroll Jumps on Modal Close

**What goes wrong:** Page scrolls to top when modal closes on iOS Safari, even though scroll position was saved.

**Why it happens:** The `window.scrollTo(0, savedScroll)` call is made before `overlay.remove()`, which means the fixed-position body is still in effect when `scrollTo` is called.

**How to avoid:** The correct teardown order is:
1. `overlay.remove()` — remove the fixed overlay
2. `document.body.style.cssText = ''` — un-fix the body
3. `window.scrollTo(0, savedScroll)` — restore scroll position

### Pitfall 4: Focus Attempt Before DOM Insertion

**What goes wrong:** `overlay.querySelector('#enemy-name').focus()` is called synchronously after `document.body.appendChild(overlay)`. On some browsers/devices this fails silently.

**Why it happens:** `appendChild` is synchronous, but browser focus requires the element to be fully rendered in the layout. On some mobile browsers the focus call must come after the first paint.

**How to avoid:** Wrap in `requestAnimationFrame()` as specified in D-06 and UI-SPEC:

```javascript
requestAnimationFrame(() => {
    overlay.querySelector('#enemy-name')?.focus();
});
```

### Pitfall 5: combatActive Out of Sync

**What goes wrong:** Player flees, combat ends, but the dismiss guard still blocks closing. Or player is mid-combat but can dismiss the modal.

**Why it happens:** The callback `onCombatStateChange` is not called at one of the two transition points, or the local `combatActive` flag in `battleModal.js` is set by stale logic.

**How to avoid:** Both transition points in `battle.js` must fire the callback:
1. After `combatActive = true` in the `startBtn` click handler (line ~330)
2. After `combatActive = false` in `endCombatUI()` (line ~291)

The flee path also ends combat via `endCombatUI()` — verify that flee goes through the same `endCombatUI()` call.

---

## Code Examples

### Existing CSS to Extend (css/style.css:276–293)

```css
/* Source: css/style.css lines 276-293 */
.modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 100;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    overflow-y: auto;
}
.modal-overlay.active { display: flex; }
```

New CSS additions follow this block:

```css
/* === Phase 7: Modal Animation === */
@keyframes modal-slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
}

@keyframes modal-fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
}

@keyframes modal-shake {
    0%   { transform: translateX(0); }
    15%  { transform: translateX(-8px); }
    30%  { transform: translateX(8px); }
    45%  { transform: translateX(-6px); }
    60%  { transform: translateX(6px); }
    75%  { transform: translateX(-4px); }
    100% { transform: translateX(0); }
}

.modal-overlay--opening .modal {
    animation: modal-slide-up 300ms ease-out;
}

.modal-overlay--closing {
    animation: modal-fade-out 300ms ease-in forwards;
}

.modal--shake {
    animation: modal-shake 300ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
    .modal-overlay--opening .modal { animation: none; }
    .modal-overlay--closing { animation: none; opacity: 0; }
    .modal--shake { animation: none; }
}
```

### Module-level State in battleModal.js

```javascript
// Source: D-03, D-06 from 07-CONTEXT.md + UI-SPEC
let savedScroll = 0;
let combatActive = false;
let escHandler = null;
let overlayRef = null; // module-level reference for closeBattleModal() to find the overlay
```

### Callbacks Object Extension in app.js

The existing `callbacks` object passed to `openBattleModal` gains one new key:

```javascript
// Source: D-01 from 07-CONTEXT.md
callbacks = {
    // ...existing keys: onStart, onRollRound, onFlee, onEnd, onStatSync, onCombatEnd, onTestLuck...
    onCombatStateChange: (active) => {
        // battleModal.js sets its local combatActive from this
    }
};
```

In practice `battleModal.js` owns the `combatActive` boolean. The `onCombatStateChange` callback in `app.js` is just a pass-through — or `battleModal.js` constructs the callbacks object itself and only passes the battle-relevant subset to `renderBattle()`.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 7 is purely CSS/JS code changes. No external CLI tools, databases, or services required beyond the running dev server (already confirmed operational from Phase 6).

---

## Sources

### Primary (HIGH confidence)

- Direct source read: `js/ui/battleModal.js` — full file (94 lines) — confirmed `closeBattleModal()` is a stub
- Direct source read: `js/ui/battle.js:165–350` — confirmed `combatActive` transition points at lines 291 and 330
- Direct source read: `css/style.css:276–293` — confirmed existing `.modal-overlay` and `.modal-overlay.active` rules
- Direct source read: `js/app.js:440–445` — confirmed existing Escape handler pattern
- Direct source read: `07-CONTEXT.md` — all decisions D-01 through D-06 locked
- Direct source read: `07-UI-SPEC.md` — animation keyframe specs, shake offsets, scroll lock contract, focus contract

### Secondary (MEDIUM confidence)

- `void el.offsetWidth` reflow trick for CSS animation re-triggering: well-established browser behavior, widely documented; no official spec URL but confirmed in multiple authoritative sources (MDN, CSS Tricks)
- `animationend` not firing when `animation: none`: MDN-documented behavior — animationend only fires for animations that run

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — vanilla JS only, no new dependencies, project constraint
- Architecture: HIGH — decisions fully locked in CONTEXT.md; existing code verified by direct read
- Pitfalls: HIGH — derived from direct code inspection (scroll order, reflow requirement, animationend behavior are well-established)

**Research date:** 2026-04-03
**Valid until:** Stable (vanilla JS/CSS — no third-party dependency drift risk)
