# Architecture Analysis — Combat Modal

**Project:** FF Console v1.1
**Milestone:** Combat modal UX restructure
**Researched:** 2026-04-03
**Confidence:** HIGH — all findings from direct codebase inspection

---

## Summary

No new architectural layers needed. The restructure splits existing `ui/battle.js` responsibilities:
- `ui/battleModal.js` (new) — modal lifecycle: create, show, close, cleanup
- `ui/battle.js` (refactored) — combat rendering scoped to a container, not the document

---

## Modal Container: Dynamically Created (not static HTML)

Follow `charCreate.js` pattern (lines 106–180):

```js
const overlay = document.createElement('div');
overlay.className = 'modal-overlay active';
document.body.appendChild(overlay);
// ...
function cleanup() { overlay.remove(); }
```

Do NOT add a static `#combat-modal` to `index.html`. Dynamic creation matches charCreate pattern and avoids DOM collision with existing `#combat-active` IDs.

---

## New Module: `js/ui/battleModal.js`

```js
// Called by app.js — receives everything as arguments (D-17 pattern)
export function openCombatModal(enemyData, getState, callbacks) {
    const overlay = document.createElement('div');
    // ... create modal chrome
    renderBattleActive(modalContent, enemyData, getState, {
        ...callbacks,
        onCombatEnd: () => { cleanup(); callbacks.onCombatEnd?.(); }
    });
    document.body.appendChild(overlay);
}
```

**Does not import `app.js`.** Receives `getState` and `callbacks` from app.js. Never the reverse.

---

## Refactored: `js/ui/battle.js`

Current: queries elements by global ID (`document.getElementById('player-stamina-fill')`)
After: scoped to container (`container.querySelector('#player-stamina-fill')`)

Rename entry point: `renderBattle(container, ...)` → `renderBattleActive(container, enemyData, getState, callbacks)`

`loadCombatHistory` export is unchanged — called on the sheet's static `#combat-history-section` element.

---

## `app.js` Changes

```js
import { openCombatModal } from './ui/battleModal.js';

// In bindEvents():
startBattleBtn.addEventListener('click', () => {
    const enemyData = readEnemyInputs();
    openCombatModal(enemyData, getState, {
        onFlee: handleFlee,
        onCombatEnd: refreshHistoryOnSheet,
    });
});
```

Remove existing `renderBattle(combatSection, ...)` call from `init()`.

---

## `index.html` Changes

**Remove:** `#combat-active` block (IDs become unambiguous inside modal)
**Keep:** `#combat-setup` form on sheet → becomes "Start Battle" trigger area
**Keep:** `#combat-history-section` on sheet — never moves

After removal, element IDs (`player-stamina-fill`, `combat-round-result`, etc.) only exist inside the dynamically created modal, so `container.querySelector` is unambiguous.

---

## Battle History (stays on sheet)

`#combat-history` and `#combat-history-section` remain static in `index.html`.

Modal close handler calls `loadCombatHistory(currentBook, historyEl)` on the sheet's history element. `loadCombatHistory` is already exported from `battle.js` and is a read-only fetch — no dependency on active-combat DOM.

---

## Data Flow

```
app.js
  ↓ openCombatModal(enemyData, getState, callbacks)
battleModal.js
  ↓ renderBattleActive(container, enemyData, getState, callbacks)
battle.js
  ↓ POST /api/sessions/{book}/actions  (per round)
  ↓ GET  /api/sessions/{book}/actions  (history on close)
backend
```

---

## Build Order

1. **`index.html`** — remove `#combat-active` block; keep `#combat-setup` and `#combat-history-section`
2. **`ui/battle.js`** — refactor entry to `renderBattleActive(container, ...)`, scope all element queries to `container.querySelector`; keep `loadCombatHistory` export unchanged
3. **`ui/battleModal.js`** (new) — `openCombatModal(enemyData, getState, callbacks)`; dynamic overlay; calls `renderBattleActive`; close handler removes overlay + refreshes history + calls `onCombatEnd`
4. **`app.js`** — import `openCombatModal`; remove `renderBattle` call; add "Start Battle" listener in `bindEvents()`
5. **`css/style.css`** — add `.combat-modal__log` scroll region; existing `.modal`/`.modal-overlay` reused for shell

---

## CSS Strategy

Reuse existing `.modal-overlay` / `.modal` CSS for the shell.
Add one new block:

```css
.combat-modal__log {
    overflow-y: auto;
    max-height: 40vh; /* round log scrolls, buttons stay visible */
}
```

New modifier class if mobile height treatment differs from book modal:
```css
@media (max-width: 480px) {
    .combat-modal { height: 100%; max-height: 100dvh; }
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Consequence |
|--------------|-------------|
| Static `#combat-modal` in `index.html` | ID collision with existing combat IDs |
| `battleModal.js` imports `app.js` | Circular import — violates D-17 |
| `renderBattleActive` called on each modal open | Listener stacking — 3 opens = 3 rounds per click |
| `#combat-history` moved inside modal DOM | History disappears when modal closes |
| Keeping `document.getElementById` in `battle.js` | Breaks when modal is not in DOM at call time |

---

## Sources

- Direct inspection: `js/ui/battle.js`, `js/ui/charCreate.js`, `js/app.js`, `index.html`, `css/style.css`
- `.planning/PROJECT.md` (D-17 pattern, architectural decisions)
