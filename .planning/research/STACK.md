# Technology Stack — Combat Modal Restructure

**Project:** FF Console v1.1
**Milestone:** Combat modal UX restructure
**Researched:** 2026-04-03
**Overall confidence:** HIGH

---

## Recommendation: Zero New Libraries

All modal infrastructure already exists in the codebase. This milestone requires no new dependencies, no new CSS techniques, and no changes to the tech stack. The work is purely extending existing patterns.

---

## Existing Modal Pattern (already in codebase — use it)

The project already ships a complete, mobile-tested modal system:

**CSS classes (css/style.css):**

```css
.modal-overlay          /* fixed, full-screen, semi-opaque backdrop */
.modal-overlay.active   /* display: flex to show */
.modal                  /* max-width 500px card, paper-bg background */
.modal-title            /* heading style */
.modal-cancel           /* full-width dismiss button */
```

**JS pattern (js/ui/charCreate.js):**

```js
const overlay = document.createElement('div');
overlay.className = 'modal-overlay active';
document.body.appendChild(overlay);

overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup();
});

function cleanup() { overlay.remove(); }
```

The combat modal should follow exactly this pattern. `charCreate.js` is the reference implementation.

**Confidence: HIGH** — Source: direct codebase inspection.

---

## Why Not `<dialog>` Element

- The existing codebase does not use `<dialog>` — mixing patterns adds cognitive load
- `charCreate.js` already demonstrates that the `div + .modal-overlay` approach works correctly on mobile
- The existing `touch-action: manipulation` rule already handles the 300ms tap delay for modal buttons

**Verdict:** Do not switch to `<dialog>`. Extend the existing pattern.

---

## Why Not `backdrop-filter`

- GPU-expensive on mid-range Android (primary mobile target)
- The existing `rgba(0,0,0,0.6)` backdrop is sufficient
- Inconsistent behavior on older Safari

**Verdict:** Keep existing `rgba` backdrop.

---

## Scroll Behavior Inside the Modal

For the combat round log, add `overflow-y: auto` with `max-height: 40vh` so the log scrolls within a fixed region while action buttons stay visible.

---

## Mobile-Specific Considerations

| Concern | Solution |
|---------|----------|
| 300ms tap delay | `touch-action: manipulation` already on `.modal-cancel`, `.mechanic-btn` |
| Virtual keyboard push | `position: fixed` + `overflow-y: auto` on overlay handles this |
| Small screens | `.modal { margin-top: 10px; }` already in `@media (max-width: 480px)` |

---

## Module Placement

```
js/ui/battle.js       (existing — combat logic and rendering)
js/ui/battleModal.js  (new — modal container, open/close, lifecycle)
```

`battleModal.js` receives `state` and callbacks as arguments (not importing `app.js`) per the D-17 pattern.

---

## CSS Additions Needed

1. `.combat-modal__log` — inner scrolling region for the round log: `overflow-y: auto; max-height: 40vh`
2. Scoped `.combat-modal` modifier if combat needs custom padding (optional)

No new CSS variables needed.

---

## Alternatives Considered

| Approach | Verdict | Reason |
|----------|---------|--------|
| `<dialog>` with `showModal()` | Reject | Inconsistent with existing pattern |
| Micro-library (e.g., a11y-dialog) | Reject | Violates vanilla JS / no-build constraint |
| CSS `backdrop-filter` | Reject | GPU cost on mobile; existing backdrop sufficient |

---

## Libraries Added

**Zero.** All modal infrastructure already exists.
