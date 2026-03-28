# Stack Research — FF Console

**Domain:** Vanilla JS combat system, dice UI, extensible stat tracking
**Date:** 2026-03-28
**Confidence:** HIGH unless noted

---

## Recommendation: Zero New Libraries

All required features are covered by native browser APIs. No npm dependencies should be added.

---

## State Management

**Pattern:** Homegrown signal-style store (~30 lines)

```js
// store.js
function createStore(initial) {
  let state = structuredClone(initial);
  const listeners = new Set();
  return {
    get: () => structuredClone(state),
    set: (patch) => { state = { ...state, ...patch }; listeners.forEach(fn => fn(state)); },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); }
  };
}
```

**Why:** No framework needed. `structuredClone` prevents accidental mutation. Callback Set avoids event bus complexity. Fits in the existing ES module pattern.

**Confidence:** HIGH

---

## Combat System

**Pattern:** Explicit finite state machine in a dedicated `combat-fsm.js` module

States: `idle → setup → active → ended`

```js
const transitions = {
  idle:   { START: 'setup' },
  setup:  { CONFIRM: 'active', CANCEL: 'idle' },
  active: { ROUND: 'active', FLEE: 'ended', VICTORY: 'ended', DEFEAT: 'ended' },
  ended:  { RESET: 'idle' }
};
```

**Why:** Combat has well-defined phases. FSM makes illegal transitions impossible. Easy to test and reason about.

**Confidence:** HIGH

---

## Round Log Rendering

**Pattern:** `insertAdjacentHTML('beforeend', ...)` — NOT `innerHTML +=`

```js
logEl.insertAdjacentHTML('beforeend', `<li class="round-entry">${html}</li>`);
```

**Why:** `innerHTML +=` re-parses and re-renders the entire list on every round. `insertAdjacentHTML` is O(1) and preserves existing DOM nodes.

**Confidence:** HIGH

---

## Log Persistence

**Pattern:** Persist battle logs to the backend (`/api/sessions/{book}/actions`) after each round and on combat end.

- Each round is a POST to the existing ActionLog endpoint
- On page load, fetch and replay logs to rebuild combat history
- localStorage as write-through cache for offline fallback

**Why:** User wants to review logs across sessions. The backend already has an ActionLog model and actions router — use it.

**Confidence:** HIGH

---

## Dice Animation

**Pattern:** CSS `@keyframes` + `animationend` event. No canvas library.

```css
@keyframes dice-roll {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg) scale(1.1); }
  75% { transform: rotate(15deg) scale(1.1); }
}
.dice--rolling { animation: dice-roll 0.4s ease; }
```

**Why:** GPU-accelerated. Works on mobile. No dependencies.

**Confidence:** HIGH

---

## Collapsible Round Log

**Pattern:** Native `<details>`/`<summary>` HTML elements

**Why:** Zero JS needed for expand/collapse. Accessible. Appropriate for a post-battle review log.

**Confidence:** HIGH

---

## Book-Specific Mechanic Configs

**Pattern:** Config-driven registry with `dynamic import()` per book number

```js
// books/configs/registry.js
const registry = { 18: () => import('./018-appointment-with-fear.js'), ... };

export async function loadBookConfig(bookNum) {
  const loader = registry[bookNum];
  return loader ? loader() : null;
}
```

Each config file exports a plain object describing extra stats, resources, and combat types.

**Why:** Lazy-loaded — only downloaded when the user selects that book. No schema validation library needed (configs are authored). Easy to add new books.

**Confidence:** HIGH

---

## CSS

**Patterns:**
- BEM-lite namespacing for new UI sections (e.g., `.combat__header`, `.combat__log`)
- New `:root` color tokens for combat states (winning/losing/neutral)
- Keep existing mobile-first layout conventions

**Confidence:** HIGH

---

## Anti-Patterns to Avoid

| Anti-pattern | Why bad | Alternative |
|---|---|---|
| `innerHTML +=` for log | Re-renders entire list each round | `insertAdjacentHTML('beforeend', ...)` |
| God-object state (everything in `gameState`) | Combat state leaks into save state | Separate in-memory combat store |
| Polling for state changes | Wastes CPU, laggy on mobile | Callback-based store subscriptions |
| Mixing combat FSM state into session state | Corrupts saves | Dedicated combat store synced to backend separately |
| Adding a frontend framework | Build step, bundle, breaking change | Vanilla JS with module pattern |

---

## Libraries Added

**Zero.** All features covered by native browser APIs and the existing codebase.

---

*Research date: 2026-03-28 | Confidence: HIGH*
