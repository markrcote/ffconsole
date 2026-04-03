# Pitfalls — Combat Modal Restructure

**Project:** FF Console v1.1
**Milestone:** Combat modal UX restructure
**Researched:** 2026-04-03
**Confidence:** HIGH — grounded in direct codebase inspection + browser/accessibility patterns

---

## Critical

### P1 — iOS Safari Scroll Lock

`body { overflow: hidden }` alone breaks on iOS Safari when a keyboard input is tapped inside the modal. The internal-scroll overlay pattern (not body scroll) is the correct mitigation.

**Fix:** Use `overflow-y: auto` on the modal's inner container. Set `max-height: calc(100dvh - 40px)` with `vh` fallback. Do not rely solely on body overflow-hidden.

**Phase:** HTML/CSS restructure

---

### P2 — Mid-Combat Modal Dismissal Destroys State

`combatActive` and `round` live as closure variables inside `renderBattle()`. If the modal is dismissed via backdrop click or Escape during a fight, that state is gone with no recovery path.

**Fix:** Guard all close paths on `combatActive`. Expose a `getIsCombatActive()` or pass an `onCombatActiveChange` callback. Disable backdrop-tap and Escape while combat is active.

**Phase:** Modal lifecycle implementation

---

### P3 — `getElementById` Queries Break After DOM Restructure

`renderBattle()` resolves all element references by ID at call time. If any ID changes or the modal isn't in the DOM when `renderBattle()` first runs, all bindings silently fail.

**Fix:** Scope all queries to `container.querySelector(...)` not `document.getElementById(...)`. Keep IDs identical to avoid breaking CSS selectors.

**Phase:** DOM wiring

---

### P4 — Z-Index Stack Corruption

Any `transform`, `filter`, or `will-change` on an ancestor element creates a new stacking context, silently breaking `position: fixed` for all descendants — including the modal overlay.

**Fix:** Audit `css/style.css` for transforms on the adventure sheet wrapper. Document a z-index scale using CSS variables.

**Phase:** HTML/CSS restructure

---

## Moderate

### P5 — No Focus Trap

Tab navigation escapes the modal to sheet elements behind it. The existing `#book-modal` has this same gap. Combat modal must implement a full Tab trap.

**Fix:** On modal open, collect all focusable elements inside modal; intercept Tab/Shift+Tab to cycle within them. Restore focus to "Start Battle" button on close.

**Phase:** Accessibility pass

---

### P6 — `#combat-history` Accidentally Nested Inside Modal DOM

History section is adjacent to `.combat-section` in the HTML — easy to accidentally include it inside the modal wrapper during restructure.

**Fix:** Keep `#combat-history-section` as a sibling of the modal trigger, not a child. Review final `index.html` diff carefully.

**Phase:** HTML/CSS restructure

---

### P7 — Event Listeners Stack on Repeated Modal Opens

If `renderBattle()` is called again each time the modal opens (to reset state), event listeners accumulate. After 3 opens, 3 rounds fire per click.

**Fix:** `renderBattle()` / `renderBattleActive()` called once at `init()`; modal uses show/hide rather than create/destroy. OR: use `{ once: true }` on listeners and re-register after each round, but the create-once approach is simpler.

**Phase:** Modal lifecycle implementation

---

### P8 — Circular Import If Modal Controller Imports `app.js`

Violates the D-17 pattern that all UI modules follow.

**Fix:** Put `openCombatModal()` / `hideCombatModal()` in `app.js`, or have `battleModal.js` receive `getState` and `callbacks` as arguments only — never import `app.js`.

**Phase:** Module structure (resolve before writing code)

---

### P9 — "New Battle" Button Ambiguity in Modal Context

Currently resets the panel to setup form. In the modal, the spec says summary screen shown before modal closes — meaning "done" should close the modal entirely, not reset inside it.

**Fix:** Pass an `onModalClose` callback from `app.js` into `renderBattleActive()` so `endCombatUI()` can trigger it. "New Battle" resets the form inside the modal; a separate "Close" / "Return to Sheet" button dismisses the modal.

**Phase:** Post-combat UX

---

## Minor

### P10 — Stale Input Values on Reopen

Enemy name/skill/stamina inputs retain previous values from last battle.

**Fix:** Reset inputs in `openCombatModal()` in `app.js` (or `battleModal.js`) before showing the modal.

**Phase:** Modal lifecycle

---

### P11 — iOS Momentum Scroll Bleeds Through Overlay

In-progress momentum scroll on the sheet continues through the overlay on iOS.

**Fix:** Call `window.scrollTo({ top: window.scrollY, behavior: 'instant' })` on modal open to halt momentum before applying scroll lock.

**Phase:** HTML/CSS restructure

---

### P12 — `dvh` Not Supported Before iOS 15.4

`100dvh` works correctly in modern Safari but not older versions.

**Fix:** Always provide `vh` fallback before `dvh` declaration:
```css
max-height: calc(100vh - 40px);
max-height: calc(100dvh - 40px);
```

**Phase:** HTML/CSS restructure

---

### P13 — Missing `aria-modal` and `inert`

Without `aria-modal="true"` and `inert` on the background, screen readers can reach sheet elements behind the modal.

**Fix:** Set `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on modal container. Set `inert` attribute on the adventure sheet `<main>` on modal open; remove on close. (`inert` has full browser support since 2023.)

**Phase:** Accessibility pass

---

## Phase Assignment Summary

| Phase | Pitfalls to Address |
|-------|---------------------|
| Module structure decision (before coding) | P8 (circular imports) |
| HTML/CSS restructure | P1 (iOS scroll), P4 (z-index), P6 (history DOM boundary), P11 (momentum), P12 (dvh) |
| Modal lifecycle | P2 (mid-combat dismissal), P7 (listener stacking), P10 (stale inputs) |
| DOM wiring | P3 (getElementById null refs) |
| Post-combat UX | P9 (New Battle button) |
| Accessibility | P5 (focus trap), P13 (aria-modal + inert) |

---

## Sources

- Direct inspection: `js/ui/battle.js`, `js/app.js`, `css/style.css`, `index.html`
- WCAG 2.1 SC 2.1.2 (No Keyboard Trap)
- MDN: iOS Safari scroll-lock patterns, `dvh` support table, `inert` attribute
