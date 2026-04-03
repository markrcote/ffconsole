# Project Research Summary

**Project:** FF Console v1.1 — Combat Modal UX Restructure
**Domain:** Mobile-first vanilla JS modal UX refactor (no new stack, no new libraries)
**Researched:** 2026-04-03
**Confidence:** HIGH

## Executive Summary

This milestone is a focused UX restructure, not a feature addition. The combat panel (enemy setup, active combat, post-battle summary) currently lives inline on the adventure sheet. The goal is to lift it into a modal overlay so combat becomes a focused, interruption-free interaction — the sheet stays behind the modal, and the player returns to it cleanly when combat ends. Every building block needed (modal CSS, dynamic overlay pattern, focus conventions) already exists in the codebase. The work is purely extending those patterns.

The recommended approach is to introduce one new module (`ui/battleModal.js`) that handles modal lifecycle, refactor `ui/battle.js` to scope all DOM queries to a container argument rather than global document IDs, and wire the trigger from `app.js`. The existing `.modal-overlay` / `.modal` CSS classes handle the shell; one new CSS block (`.combat-modal__log`) is the only style addition needed. No new libraries, no build-step changes, no backend changes.

The primary risks are not architectural — they are browser-specific and interaction-state-specific. iOS Safari's scroll lock behavior, mid-combat accidental dismissal destroying in-memory round state, and event listener accumulation on repeated modal opens are the three pitfalls most likely to cause real bugs. All three have clear, well-established fixes. The secondary risk is violating the existing D-17 pattern (UI modules must not import `app.js`), which is avoided by passing `getState` and `callbacks` as arguments rather than importing upstream.

---

## Key Findings

### Recommended Stack

Zero new dependencies. The codebase already ships a complete, mobile-tested modal system in `css/style.css` (`.modal-overlay`, `.modal`, `.modal-title`, `.modal-cancel`) and `js/ui/charCreate.js` provides the reference implementation for dynamic modal creation. The combat modal follows exactly this pattern.

`<dialog>` with `showModal()` was considered and rejected — it is inconsistent with the existing pattern and adds cognitive overhead for no benefit. `backdrop-filter` was rejected due to GPU cost on mid-range Android. The existing `rgba(0,0,0,0.6)` backdrop is sufficient.

**Core technologies:**
- Existing `.modal-overlay` / `.modal` CSS — modal shell, reused as-is — already mobile-tested
- `charCreate.js` dynamic overlay pattern — reference implementation for open/close lifecycle
- `overflow-y: auto` + `max-height: 40vh` (new `.combat-modal__log`) — inner scroll region for round log
- `100dvh` with `vh` fallback — full-height mobile treatment for small screens

### Expected Features

**Must have (table stakes):**
- Modal opens on "Start Battle" button tap — replaces inline panel with a focused overlay
- Explicit Close button after post-battle summary — only safe dismiss path once combat ends
- Backdrop blocks all sheet interaction during combat — `position: fixed` overlay covers sheet
- Body scroll locked on open, restored on close — iOS-safe inner scroll approach required
- Focus moves to first modal element on open — enemy name input receives autofocus
- Focus restored to "Start Battle" trigger on close — standard browser/accessibility contract
- Escape key closes modal only when not in active combat — no-op during fight
- Backdrop tap disabled during active combat — prevents accidental mid-fight state loss
- Combat history refresh on close — `loadCombatHistory` called on sheet's static element

**Should have (differentiators):**
- Slide-up entrance animation — `transform: translateY(100%) → 0`, 200ms ease-out, `prefers-reduced-motion` guarded
- Fade-out on close — `opacity: 0` transition before DOM removal
- Round log auto-scrolls to latest entry — `scrollIntoView({ behavior: 'smooth' })` after each render
- Full-height on small screens — `height: 100%` / `max-height: 100dvh` at `max-width: 480px`

**Defer (v2+):**
- Animated 3D dice inside modal — adds complexity; die-face number display is sufficient
- Swipe-down gesture to dismiss — conflicts with scroll within modal
- Luck test as a nested modal — keep it as inline button within the combat modal

### Architecture Approach

The restructure splits existing `battle.js` responsibilities across two modules without introducing new architectural layers. `ui/battleModal.js` (new) owns modal lifecycle: create overlay, append to body, wire close guards, call `renderBattleActive`, clean up on close. `ui/battle.js` (refactored) owns combat rendering and logic scoped to a container argument — all `document.getElementById()` calls become `container.querySelector()`. History loading (`loadCombatHistory`) is unchanged and remains exported for use on the sheet's static element. `app.js` is the only file that imports `battleModal.js`; the modal module receives `getState` and `callbacks` as arguments and never imports upstream. The `#combat-history-section` element stays in static HTML and is never moved inside the modal DOM.

**Major components:**
1. `ui/battleModal.js` (new) — modal lifecycle: overlay creation, scroll lock, focus management, dismiss guards, close/cleanup
2. `ui/battle.js` (refactored) — `renderBattleActive(container, enemyData, getState, callbacks)`: all combat rendering scoped to container; `loadCombatHistory` export unchanged
3. `app.js` (wiring change) — imports `openCombatModal`; adds "Start Battle" click listener; removes legacy `renderBattle` call from `init()`
4. `css/style.css` (minimal addition) — `.combat-modal__log` scroll region; mobile full-height modifier at `max-width: 480px`

### Critical Pitfalls

1. **iOS Safari scroll lock (P1 + P11)** — `body { overflow: hidden }` alone fails on iOS when a keyboard input is tapped inside the modal; in-progress momentum scroll on the sheet also bleeds through the overlay. Fix: use `overflow-y: auto` on the modal's inner container with `max-height: calc(100dvh - 40px)`; call `window.scrollTo({ top: window.scrollY, behavior: 'instant' })` on modal open to halt momentum before applying lock. Address in HTML/CSS restructure phase.

2. **Mid-combat dismissal destroys state (P2)** — `combatActive` and `round` live as closure variables inside `renderBattle()`. If the modal closes mid-fight, that state is unrecoverable with no error shown to the player. Fix: guard every close path (backdrop click, Escape key, close button) on a `combatActive` flag; expose it via a getter. Address in modal lifecycle implementation.

3. **Listener stacking on repeated opens (P7)** — if `renderBattleActive()` is called fresh each time the modal opens, event listeners accumulate. After 3 opens, 3 rounds fire per click. Fix: use the create-on-open / destroy-on-close modal pattern — the modal's DOM removal takes all listeners with it, making cleanup automatic. Address in modal lifecycle implementation.

4. **`getElementById` breaks after DOM restructure (P3)** — `battle.js` currently resolves all element references by global ID at call time. After the restructure these IDs only exist inside the dynamically created modal, so calls before the modal opens silently return null. Fix: scope all queries to `container.querySelector(...)`. Address in DOM wiring before any other battle.js changes.

5. **Circular import if `battleModal.js` imports `app.js` (P8)** — violates the D-17 pattern that all existing UI modules follow. Fix: `battleModal.js` receives `getState` and `callbacks` as arguments only; never imports `app.js`. Resolve the module boundary before writing any code.

---

## Implications for Roadmap

### Phase 1: Module Structure and DOM Cleanup

**Rationale:** The circular import risk (P8) and `getElementById` scope problem (P3) must be resolved before any modal code is written. Establishing the correct module boundary and cleaning `index.html` first means all subsequent phases build on a stable, correct foundation.
**Delivers:** Clean D-17-compliant module boundary defined; `index.html` with `#combat-active` block removed and "Start Battle" trigger in place; `battle.js` entry point refactored to `renderBattleActive(container, ...)` with all element queries scoped to container
**Addresses:** Container-scoped DOM queries; module import direction
**Avoids:** P3 (getElementById null refs), P8 (circular imports)

### Phase 2: Modal Lifecycle — Open, Close, Scroll Lock

**Rationale:** Core modal infrastructure must be correct before any combat logic runs inside it. Scroll lock and focus management are foundational — retrofitting them after combat wiring creates regression risk.
**Delivers:** `battleModal.js` with `openCombatModal()` and close logic; body scroll lock with iOS-safe inner scroll; focus moved to enemy name input on open; focus restored to trigger on close; Escape key guard; backdrop click guard during active combat
**Addresses:** All table-stakes modal features except post-summary Close button
**Avoids:** P1 (iOS scroll lock), P2 (mid-combat dismissal), P11 (momentum bleed), P12 (dvh fallback)

### Phase 3: Combat Wiring Inside Modal

**Rationale:** With modal container stable and lifecycle correct, plug `renderBattleActive` in and verify the full combat flow (setup to fight to summary) works end-to-end inside the modal.
**Delivers:** Full combat flow inside modal; listener lifecycle clean (create-on-open, destroy-on-close); post-summary "Close" button wired to `onCombatEnd`; stale enemy inputs cleared on reopen; history refresh triggered on close
**Addresses:** All existing combat features (stamina bars, luck prompt, flee, summary); post-summary Close button; history refresh
**Avoids:** P7 (listener stacking), P9 (New Battle button ambiguity in modal context), P10 (stale inputs on reopen)

### Phase 4: CSS Polish and Animations

**Rationale:** Defer visual polish until the functional flow is verified. Animation and mobile height treatment are safely additive — no risk of breaking combat logic or state management.
**Delivers:** Slide-up entrance animation; fade-out on close; `.combat-modal__log` scroll region with auto-scroll to latest round; full-height mobile treatment; z-index audit for stacking context corruption
**Addresses:** Differentiator features (animation, log auto-scroll, full-height small screens)
**Avoids:** P4 (z-index stack corruption from ancestor transforms), P12 (dvh fallback for older Safari)

### Phase 5: Accessibility Pass

**Rationale:** Accessibility attributes and focus trap depend on the final modal DOM structure being stable. Doing this last avoids rework if structure changes in phases 1–4.
**Delivers:** Tab focus trap (Tab/Shift+Tab cycles within modal); `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on modal container; `inert` attribute on `<main>` while modal is open; removed on close
**Addresses:** Keyboard and screen reader user expectations
**Avoids:** P5 (no focus trap — tab escapes to sheet behind overlay), P13 (missing aria-modal and inert)

### Phase Ordering Rationale

- Module boundary and DOM cleanup must precede all other phases — circular import risk and scoping issues would silently corrupt everything built on top.
- Lifecycle (scroll lock, focus, dismiss guards) must be correct before combat logic runs inside the modal — these produce the highest-consequence bugs if wrong and are harder to retrofit.
- CSS polish and accessibility are safely deferrable; they are purely additive (style attributes, ARIA) and do not touch state or event logic.
- The create-destroy modal pattern (vs. show/hide reuse) makes listener cleanup automatic in Phase 3, significantly reducing complexity.

### Research Flags

All phases use standard, well-documented patterns. No phase requires deeper research before implementation:

- **Phase 1 (Module Structure):** Pure refactor of existing code against the D-17 pattern already documented in PROJECT.md.
- **Phase 2 (Lifecycle):** iOS scroll lock and dvh fallback are known browser behaviors with fixed solutions documented in PITFALLS.md.
- **Phase 3 (Combat Wiring):** Plugging existing combat rendering into the container pattern; reference implementation is `charCreate.js`.
- **Phase 4 (CSS Polish):** CSS transform animations and `prefers-reduced-motion` are standard, well-documented patterns.
- **Phase 5 (Accessibility):** `inert`, `aria-modal`, and focus traps are documented WCAG patterns with full 2023+ browser support.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase inspection confirmed all modal infrastructure exists; zero new dependencies required |
| Features | HIGH | Existing `battle.js` and `index.html` read directly; table stakes derived from WCAG 2.1 and established modal UX contracts |
| Architecture | HIGH | Module boundaries and data flow verified against `charCreate.js` reference and D-17 pattern in PROJECT.md |
| Pitfalls | HIGH | iOS scroll and listener stacking are well-documented browser behaviors; state-loss risk is a direct reading of `battle.js` closure variables |

**Overall confidence:** HIGH

### Gaps to Address

- **Animation timing values:** Slide-up duration (200ms) and easing are judgment calls. Verify against device feel during Phase 4 and adjust if needed — no correctness risk, only polish.
- **`combatActive` exposure mechanism:** Research establishes the requirement (guard all close paths on this flag) but leaves the exact API — getter function, callback, or module-level variable — to implementation judgment. Decide explicitly at the start of Phase 2 before writing the close handler.
- **`inert` minimum browser baseline:** `inert` has full browser support since 2023. If the project targets browsers older than that, fall back to `aria-hidden="true"` on `<main>`. The project's minimum supported browser version is not explicitly documented in CLAUDE.md.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `js/ui/battle.js`, `js/ui/charCreate.js`, `js/app.js`, `index.html`, `css/style.css` — existing modal pattern, combat DOM structure, D-17 architectural pattern
- `.planning/PROJECT.md` — D-17 pattern definition, architectural decisions
- WCAG 2.1 SC 2.1.2 (No Keyboard Trap) — focus trap and Escape key requirements
- MDN: iOS Safari scroll-lock patterns, `dvh` support table, `inert` attribute browser support

### Secondary (MEDIUM confidence)
- `prefers-reduced-motion` media query — animation guard; well-established pattern applied here as standard practice

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
