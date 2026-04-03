# Phase 7: Modal Lifecycle and UX — Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the full production lifecycle for the battle modal: open with focus management, body scroll lock (iOS Safari-safe), slide-up animation; dismiss blocked during active combat (with subtle shake feedback); clean teardown on close.

Requirements in scope: MODAL-04, MODAL-05, MODAL-10, MODAL-11, MODAL-12.
Requirements out of scope: MODAL-06, MODAL-07, MODAL-08, MODAL-09 (Phase 8 — post-combat summary and history refresh).

Full Tab trap, `aria-modal`, and `inert` on background sheet are **explicitly deferred** (documented in REQUIREMENTS.md Future Requirements).

</domain>

<decisions>
## Implementation Decisions

### combatActive Signal
- **D-01:** Add `onCombatStateChange(active)` to the existing `callbacks` object passed to `renderBattle()`. `battleModal.js` flips a local boolean flag when this callback fires. When the flag is `true`, Escape and backdrop-tap are blocked. Consistent with the D-17/D-09 pattern — battle.js pushes state up via callback, modal reacts.

### Dismiss Guard
- **D-02:** When Escape or backdrop is tapped during active combat, the modal plays a **subtle shake animation** (CSS keyframe, ~300ms) to signal "locked." No text, no sound — purely physical feedback. When combat is not active (e.g., enemy setup form), Escape and backdrop should close normally (Phase 8 will refine the post-combat state; for now, only setup → can close freely).

### Scroll Lock
- **D-03:** Use the **`position:fixed` + saved `scrollY`** technique for iOS-safe scroll lock.
  - On open: `savedScroll = window.scrollY`, then `document.body.style.cssText = 'position:fixed; top:-${savedScroll}px; width:100%;'`
  - On close: clear body inline styles, `window.scrollTo(0, savedScroll)`
  - This is the established cross-browser fix that prevents bounce-scroll bleed-through on iOS Safari.

### Animation
- **D-04:** Modal **slides up from bottom** on open and **fades out** on close. Duration: **300ms** for both transitions. Easing: Claude's discretion (ease-out for open, ease-in for close is conventional).
- **D-05:** When `prefers-reduced-motion: reduce` is set, skip both animations entirely — modal appears/disappears instantly.

### Focus Management
- **D-06:** On open, focus moves to `#enemy-name` (the enemy name input — first interactive element in the setup form). Use `requestAnimationFrame` or a short `setTimeout(0)` after `appendChild` to ensure the element is in the DOM before focusing.

### Claude's Discretion
- Exact easing curves for slide-up and fade-out (ease-out/ease-in conventional)
- Whether shake animation is also applied on non-combat Escape attempts (no — free dismiss when setup is showing)
- CSS keyframe timing for the shake (3–4 rapid translate offsets, ~300ms total)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and project files.

### Project & Requirements
- `.planning/REQUIREMENTS.md` — MODAL-04, MODAL-05, MODAL-10, MODAL-11, MODAL-12 acceptance criteria; Future Requirements section lists what is explicitly deferred
- `.planning/PROJECT.md` — Key Decisions table (D-17 pattern, create-on-open/destroy-on-close, modal lifecycle)
- `CLAUDE.md` — Architecture overview, D-17/D-09 pattern, module responsibilities

### Existing Implementation
- `js/ui/battleModal.js` — `openBattleModal()` fully built; `closeBattleModal()` is an empty stub — Phase 7 implements teardown here
- `js/ui/battle.js:165–` — `renderBattle(container, getState, callbacks, historyContainer)` — callbacks object shape; `combatActive` lives as a closure variable at line 169
- `js/ui/charCreate.js` — reference modal pattern (`overlay.className = 'modal-overlay active'`, `overlay.remove()`)
- `css/style.css:276–293` — existing `.modal-overlay` / `.modal-overlay.active` CSS to extend with animation classes
- `js/app.js:440–445` — existing Escape handler for book modal (pattern to follow for battle modal Escape)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.modal-overlay.active` display pattern already in `css/style.css:291` — extend with a modifier class (e.g., `.modal-overlay--closing`) for fade-out
- `charCreate.js` `overlay.remove()` teardown pattern — `closeBattleModal()` should mirror this
- Existing `callbacks` object in `renderBattle()` already has `onEnd`, `onFlee`, `onCombatEnd` — `onCombatStateChange` slots in alongside these

### Established Patterns
- **D-17 callback pattern**: `battleModal.js` receives all state it needs via `getState` and `callbacks` — never imports `app.js`
- **create-on-open / destroy-on-close**: overlay element created fresh on each `openBattleModal()` call, removed on `closeBattleModal()`
- **Escape handler in app.js**: current book-modal Escape at `app.js:440–445` — battle modal needs its own Escape handler scoped to the overlay lifecycle (add on open, remove on close)

### Integration Points
- `battleModal.js`: `openBattleModal()` adds scroll lock + animation + focus; `closeBattleModal()` restores scroll + removes overlay
- `battle.js`: add `onCombatStateChange` call in two places — where `combatActive = true` (line 330 area) and where `combatActive = false` (line 291 area)
- `css/style.css`: add `@keyframes modal-slide-up`, `@keyframes modal-shake`, `@media (prefers-reduced-motion: reduce)` overrides
- `app.js`: `closeBattleModal` imported and called from `onCombatEnd` callback (or equivalent teardown path) — Phase 8 owns the explicit Close button, but Phase 7 may need to confirm teardown path for non-combat-ended closes

</code_context>

<specifics>
## Specific Ideas

- Shake animation: rapid translate offsets left-right, ~300ms total — gives physical "no" feedback without text
- Animation: 300ms deliberate feel — user chose this explicitly over snappy 200ms to match FF atmosphere
- Scroll lock: position:fixed technique specifically requested for iOS Safari safety

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-modal-lifecycle-and-ux*
*Context gathered: 2026-04-03*
