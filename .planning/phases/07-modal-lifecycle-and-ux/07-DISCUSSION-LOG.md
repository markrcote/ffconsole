# Phase 7: Modal Lifecycle and UX — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 07-modal-lifecycle-and-ux
**Areas discussed:** combatActive signal, dismiss guard, scroll lock, animation

---

## combatActive Signal

| Option | Description | Selected |
|--------|-------------|----------|
| Callback in callbacks object | Add onCombatStateChange(active) to existing callbacks. battleModal.js flips a local flag. Consistent with D-17 — battle.js pushes state up, modal reacts. | ✓ |
| Export a getter from battle.js | renderBattle() returns { isCombatActive } or exports a module-level getter. battleModal.js pulls when needed. | |
| Mutable ref object | battleModal.js passes { active: false } to renderBattle(); battle.js writes to it. | |

**User's choice:** Callback in callbacks object
**Notes:** D-17 consistency was the deciding factor.

---

## Dismiss Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Pure no-op | Nothing. No animation, no message. Matches MODAL-05 spec exactly. | |
| Subtle shake | Modal briefly shakes (CSS keyframe, ~300ms) to signal 'locked'. No text, no sound. | ✓ |

**User's choice:** Subtle shake
**Notes:** Applies only during active combat. Setup form (pre-combat) can dismiss freely.

---

## Scroll Lock

| Option | Description | Selected |
|--------|-------------|----------|
| position:fixed + saved scroll | Save window.scrollY, fix body position, restore on close. Established iOS Safari fix. | ✓ |
| overflow:hidden only | Simple. Works on desktop/Android. Breaks iOS Safari. | |
| touchmove preventDefault | Granular but brittle — misses scroll inside modal. | |

**User's choice:** position:fixed + saved scroll
**Notes:** Full iOS Safari-safe technique explicitly requested.

---

## Animation Feel

| Option | Description | Selected |
|--------|-------------|----------|
| Snappy — 200ms | Quick slide-up open, fast fade-out close. | |
| Deliberate — 300ms | Slightly slower, more polished. Matches FF atmosphere. | ✓ |
| Claude's discretion | Claude picks duration and easing. | |

**User's choice:** Deliberate — 300ms
**Notes:** Both open (slide-up) and close (fade-out) at 300ms.

---

## Claude's Discretion

- Exact easing curves for slide-up / fade-out
- Shake keyframe timing details
- Whether shake is shown on Escape during setup form (decided: no — only during active combat)

## Deferred Ideas

None — discussion stayed within phase scope.
