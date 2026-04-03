# Feature Landscape

**Domain:** Combat modal UX restructure — mobile-first vanilla JS gamebook companion
**Researched:** 2026-04-03
**Scope:** Modal overlay for the combat system only. Everything else (stats, history log, book mechanics) stays on the adventure sheet.

---

## Existing System (Already Built — Do Not Regress)

These are already implemented in `js/ui/battle.js` and must survive the restructure intact:

| Feature | Location | Notes |
|---------|----------|-------|
| Enemy setup form (name, Skill, Stamina inputs) | `#combat-setup` | Inline on sheet today |
| Round-by-round combat with roll button | `#combat-active` | Full round card with die values, AS, outcome |
| Luck test prompt after each hit | `showLuckPrompt()` | Appears after `player_hit` or `enemy_hit` |
| Live stamina bars (player + enemy) | `updateStaminaBars()` | Both bars updated after each round |
| Flee button with Stamina penalty | `#flee-combat` | Triggers `onFlee` callback, syncs server state |
| Post-battle summary (Victory/Defeated/Fled) | `renderSummaryHTML()` | Rounds, final stamina, enemy name |
| "New Battle" reset button | Inside summary | Returns to setup state |
| Battle history log | `#combat-history` (on sheet) | Persists via ActionLog backend — stays on sheet |

The restructure moves everything inside `#combat-setup` and `#combat-active` into a modal overlay. The `#combat-history` section does NOT move.

---

## Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Modal opens on "Start Battle" button tap | Replace inline panel with a dedicated trigger | Low | Modal holds the full combat flow |
| Explicit close affordance after summary | User needs a clear escape hatch | Low | Only safe after combat ends — during combat, accidental dismiss risks losing round state |
| Backdrop blocks sheet interaction | Combat is the current action | Low | `position: fixed` overlay covers sheet; ensure `pointer-events` blocks through |
| Scroll within modal, sheet scroll locked | Round log grows; sheet scrolling behind is disorienting | Medium | `overflow-y: auto` on inner container; `document.body.style.overflow = 'hidden'` on open, restore on close |
| Focus moves into modal on open | Keyboard/screen-reader users tab into sheet behind overlay without this | Medium | `autofocus` on first interactive element, or manual `.focus()` call after render |
| Focus restored to trigger button on close | Standard browser/accessibility contract | Low | Store reference to opener, call `.focus()` on close |
| Escape key closes modal when safe | Keyboard UX expectation — suppress during active combat | Low | No-op if `combatActive === true` |
| No backdrop-tap-to-dismiss during active combat | Accidental dismiss mid-fight destroys in-memory round state | Low | Tap-to-dismiss only in setup state or post-summary |
| Post-summary dismiss button | After Victory/Defeat/Fled, user needs to return to sheet | Low | "New Battle" resets to setup; separate "Close" button dismisses modal entirely |

---

## Differentiators

| Feature | Value | Complexity | Notes |
|---------|-------|------------|-------|
| Slide-up entrance animation | Feels like a focused action being invoked | Low | `transform: translateY(100%) → translateY(0)` with 200ms ease-out; wrap in `@media (prefers-reduced-motion: no-preference)` |
| Fade-out on close | Smooth return to sheet | Low | `opacity: 0` transition, restore after `transitionend` |
| Round log scrolls to latest entry | Newest card in view without manual scroll | Low | `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` after render |
| Full-height on small screens | On phones, combat needs all available vertical space | Low | `height: 100%` on small viewports; `max-height: 90vh` on larger |

---

## Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Backdrop tap dismisses mid-combat | Destroys round state |
| Animated 3D dice inside modal | Adds complexity; die-face number display is sufficient |
| Swipe-down gesture to dismiss | Conflicts with scroll within modal |
| Confirm dialog before flee | Flee already has stamina consequences — trust the player |
| Nested modals (luck test as second modal) | Keep luck test as inline button within combat modal |

---

## Feature Dependencies

```
"Start Battle" trigger button (on sheet)
  → opens combat modal
    → enemy setup form (existing)
      → Start Combat button
        → active combat view (existing: stamina bars, roll, flee, luck prompt)
          → combat end (win / lose / flee)
            → post-summary screen (existing)
              → "New Battle" button (resets to setup — existing)
              → "Close" button (NEW — dismisses modal entirely)

Modal open:
  → lock body scroll
  → move focus to first interactive element (enemy name input)
  → backdrop tap allowed (not yet in combat)

Active combat:
  → disable backdrop-tap-to-dismiss
  → suppress Escape key

Modal close:
  → restore body scroll
  → restore focus to "Start Battle" trigger
  → refresh combat history on sheet (loadCombatHistory)
```

---

## MVP Build Order

1. Trigger button + modal open/close scaffolding (includes body scroll lock + slide-up animation)
2. Focus management + Escape + dismiss guard
3. Post-summary "Close" button
4. History log refresh on close

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| What's already built | HIGH | Direct codebase read of `battle.js`, `index.html`, `style.css` |
| Modal UX table stakes | HIGH | Well-established browser/WCAG/mobile patterns |
| No-dismiss-during-combat | HIGH | Direct consequence of in-memory state in `battle.js` |
| Animation specifics | MEDIUM | CSS transform approach is standard; timing values are judgment calls |

---

## Sources

- Codebase: `js/ui/battle.js`, `index.html`, `css/style.css`, `.planning/PROJECT.md`
- WCAG 2.1 SC 2.1.2 (No Keyboard Trap)
- CSS `prefers-reduced-motion` media query
