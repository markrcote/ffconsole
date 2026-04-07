---
phase: 11
phase_name: Recovery Actions
status: draft
created: 2026-04-07
milestone: v1.2 Defeat State
---

# UI-SPEC — Phase 11: Recovery Actions

## Summary

This phase wires the two disabled buttons already rendered in `#dead-state` (`#dead-restart`, `#dead-change-book`) and removes the placeholder hint text. No new UI surfaces are introduced. The only interaction design questions are the confirm dialog copy for Change Book and the visual treatment of the two buttons relative to each other.

---

## Design System

**Tool:** None (vanilla JS, no component library)
**Source:** Custom CSS design system in `css/style.css`

### Detected Tokens

| Token | Value | Role |
|-------|-------|------|
| `--ink-color` | `#2c1810` | Primary text, borders, button fill |
| `--ink-light` | `#4a3428` | Secondary text, separators |
| `--paper-bg` | `#f4e4c1` | Dominant surface (60%) |
| `--paper-dark` | `#e8d4a8` | Secondary surface — cards, stat rows (30%) |
| `--paper-shadow` | `#d4c090` | Borders, dividers |
| `--accent-red` | `#8b2500` | Accent — destructive actions, dead state, book title (10%) |
| `--accent-green` | `#5a8a3c` | Secondary semantic — success states only |

---

## Spacing

Scale: 4px base unit, multiples of 4 only.

| Step | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight inline gaps |
| sm | 8px | Button gap in `.dead-state__actions` |
| md | 16px | Section internal padding |
| lg | 24px | Section bottom margin |
| xl | 32px | Major section separation |

**Existing dead-state spacing (do not change):**
- `.dead-state` padding: `2rem 1rem` (32px 16px)
- `.dead-state__actions` gap: `0.5rem` (8px) — maintain
- `.dead-state__actions` max-width: `200px` — maintain
- `.dead-state__actions` margin-bottom: `1rem` (16px) — maintain

**Touch target minimum:** 48px height — already enforced by `.mechanic-btn { min-height: 48px }`.

---

## Typography

### Fonts

| Font | Family | Role |
|------|--------|------|
| MedievalSharp | `'MedievalSharp', cursive` | UI labels, buttons, headers |
| Caveat | `'Caveat', cursive` | Numeric values, results, handwriting text |

### Scale (3 sizes in use for this phase)

| Size | Value | Weight | Usage |
|------|-------|--------|-------|
| body-sm | `0.9rem` (≈14px) | 400 (normal) | Button labels via `.mechanic-btn` |
| body | `1rem` (16px) | 400 (normal) | Hint text, confirm dialog body |
| banner | `2rem` (32px) | 700 (bold) | "YOU ARE DEAD" banner — existing, unchanged |

**Weights:** 400 (normal) and 700 (bold) only.
**Line height:** 1.5 for body text; 1.2 for banner/heading.

---

## Color Contract

### 60 / 30 / 10 Split

| Share | Token | Elements |
|-------|-------|----------|
| 60% | `--paper-bg` `#f4e4c1` | Page background, button default fill |
| 30% | `--paper-dark` `#e8d4a8` | Stat rows inside dead-state card |
| 10% | `--accent-red` `#8b2500` | Banner text/border, Change Book button danger modifier |

### Accent Reserved For

Accent (`--accent-red`) is reserved for these specific elements in this phase:
1. `.dead-state__banner` — text color and border (existing)
2. `#dead-change-book` — uses `.mechanic-btn--danger` modifier (danger = destructive action)

### Semantic Colors

| Color | Usage |
|-------|-------|
| `--accent-red` | Destructive actions (Change Book deletes a session) |
| `--accent-green` | Not used in this phase |

---

## Component Inventory

### Buttons — Dead State Actions

Two buttons exist in `index.html` as `#dead-restart` and `#dead-change-book`, both currently `disabled`. This phase enables them by removing `disabled` at bind time (D-04).

**#dead-restart**
- Class: `mechanic-btn mechanic-btn--primary`
- Label: `Restart`
- Visual: ink-dark fill, parchment text — primary action, positive forward path
- Touch target: 48px min-height (from `.mechanic-btn`)
- Behavior: Calls `showCharCreate()` with current book pre-selected; no confirm required

**#dead-change-book**
- Class: `mechanic-btn mechanic-btn--danger`
- Label: `Change Book`
- Visual: parchment fill, `--accent-red` text and border — signals destructive/permanent action
- Touch target: 48px min-height
- Behavior: Opens `window.confirm()` dialog before proceeding; no-op if cancelled

**Layout:** `.dead-state__actions` is `flex-direction: column`, max-width 200px, centered. Restart stacks above Change Book. No layout changes needed.

---

## Copywriting Contract

### Primary CTA

`Restart` — clear, imperative, one word. No change from existing placeholder label.

### Secondary CTA

`Change Book` — clear, two words. No change from existing placeholder label.

### Confirm Dialog (Change Book)

**Source:** Claude's Discretion (D-02 specified `window.confirm()`; exact text deferred to this phase)

```
Delete this session? This cannot be undone.
```

Rationale: Mirrors the established pattern in `app.js:550` (`'Mark your character as dead? This cannot be undone.'`). Short, declarative, matches the voice used elsewhere. Uses `window.confirm()` — native browser dialog, no custom modal.

### Hint Text Removal

`<p class="dead-state__hint">Recovery actions coming soon</p>` is removed entirely from `index.html` once buttons are wired (D-05). No replacement text.

### Empty State

Not applicable — this phase operates only when the dead state is already visible (character is dead). There is no empty state for the recovery action buttons themselves.

### Error State

**DELETE failure (Change Book):** Log `console.error('deleteSession failed:', err)` and allow the flow to continue — charCreate overlay opens regardless. Do not surface the error to the user; the session cleanup is best-effort and the player's next action (picking a book) will create a fresh session anyway. This matches the `fail silently vs log` discretion noted in CONTEXT.md, resolved as: log, then continue.

**No toast, no inline error message.** The game must keep moving.

### Destructive Actions

| Action | Element | Confirmation approach |
|--------|---------|----------------------|
| Change Book (deletes current session) | `#dead-change-book` | `window.confirm()` native dialog — single step, matches existing confirm pattern in codebase |

---

## Interaction States

### Button States

| State | Restart | Change Book |
|-------|---------|-------------|
| Default | `.mechanic-btn--primary` (ink fill) | `.mechanic-btn--danger` (red border, parchment fill) |
| Hover | `--accent-red` fill, parchment text | `rgba(139,37,0,0.15)` background (from `.mechanic-btn--danger:active` — apply on hover too via CSS) |
| Active / tap | `scale(0.95)` via existing `.stat-btn:active` pattern | same |
| Disabled (before bind) | `opacity: 0.3` via `button:disabled` | same |
| Enabled (after bind) | `disabled` attribute removed | same |

Note: `.mechanic-btn` does not have an explicit `:active` scale. No new CSS is required — the buttons are already styled. Only the `disabled` attribute removal is needed.

### Flow States

**Restart flow:**
1. Player taps Restart
2. `showCharCreate()` called immediately with `currentBook` set to current book number
3. charCreate overlay opens with book pre-selected
4. `_applyNewCharacter()` overwrites dead session with fresh stats
5. Dead state replaced by normal adventure sheet

**Change Book flow:**
1. Player taps Change Book
2. `window.confirm('Delete this session? This cannot be undone.')` shown
3. If cancelled → no-op, dead state remains
4. If confirmed → `deleteSession(currentBook)` called (DELETE + localStorage cleanup)
5. `showCharCreate()` called with `currentBook = null`
6. charCreate overlay opens with no pre-selection; backdrop not dismissible (first-launch behavior)

---

## CSS Changes

**None required.** All button styles are already declared:
- `.mechanic-btn` — base
- `.mechanic-btn--primary` — Restart
- `.mechanic-btn--danger` — Change Book
- `.dead-state__actions` — container layout

The only HTML change is:
1. Remove `disabled` from both buttons at bind time (JS, not CSS)
2. Remove `<p class="dead-state__hint">...</p>` from `index.html`

If `.mechanic-btn--danger:hover` state is missing, add it to `css/style.css` adjacent to `.mechanic-btn--danger:active`:

```css
.mechanic-btn--danger:hover {
    background: rgba(139, 37, 0, 0.12);
}
```

---

## Registry

Not applicable — vanilla JS, no component registry.

---

## Accessibility

- Both buttons must have visible focus rings (browser default is sufficient for this codebase — no custom focus styles defined)
- `window.confirm()` is natively accessible (screen readers announce it)
- After Restart: focus moves to book search input inside charCreate overlay (handled by existing `charCreate.js`)
- After Change Book confirm → flow completion: focus moves to book search input in the fresh charCreate overlay

---

## Pre-Population Sources

| Decision | Source |
|----------|--------|
| Button labels ("Restart", "Change Book") | CONTEXT.md D-01, D-02 — locked |
| Restart calls `showCharCreate()` with same book | CONTEXT.md D-01 — locked |
| Change Book uses `window.confirm()` | CONTEXT.md D-02 — locked |
| `disabled` removed at bind time | CONTEXT.md D-04 — locked |
| Hint text removed | CONTEXT.md D-05 — locked |
| Exact confirm dialog text | CONTEXT.md "Claude's Discretion" — resolved above |
| DELETE error handling | CONTEXT.md "Claude's Discretion" — resolved above |
| Button classes (mechanic-btn--primary / --danger) | CSS audit of `css/style.css` |
| Spacing, typography, color tokens | CSS audit of `css/style.css` |
| No new CSS needed | CSS audit confirms all modifiers exist |
