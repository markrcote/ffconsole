# Phase 10: Combat Modal Defeat Screen — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 10-combat-modal-defeat-screen
**Areas discussed:** Defeat screen visual, Defeat screen content

---

## Defeat Screen Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Dramatic — red/dark theme | Dark background or strong red accent on the modal card, large defeat heading. Matches YOU ARE DEAD sheet state. | ✓ |
| CSS polish only | Keep same layout, add red border/title color and maybe skull icon. Minimal change. | |
| Message-forward | Lead with "Your adventure ends here." dramatic text before stats. Different structure from victory. | |

**Follow-up — where styling applies:**

| Option | Description | Selected |
|--------|-------------|----------|
| Full modal card goes dark/red | Entire .battle-modal card gets dark red background when defeat occurs | ✓ |
| Heading band only | Just the defeat heading section gets a red/dark band; stats below remain normal | |

**User's choice:** Full dark/red modal card with "YOU WERE DEFEATED" heading, same stats layout.

---

## Defeat Screen Content

| Option | Description | Selected |
|--------|-------------|----------|
| Full stats: rounds + both staminas | Same data as victory: rounds fought, your final Stamina (0/max), enemy's remaining Stamina | ✓ |
| Minimal: enemy name only | Just show "Slain by: [name]". More dramatic, less clinical. | |

**Implementation approach:**

| Option | Description | Selected |
|--------|-------------|----------|
| Replace via onPlayerDefeated | battleModal.wrappedCallbacks.onPlayerDefeated intercepts and replaces #combat-summary content | ✓ |
| Modify renderSummaryHTML | Extend battle.js renderSummaryHTML to produce defeat-specific markup directly | |

**User's choice:** Full stats (symmetric with victory), implemented via onPlayerDefeated intercept in battleModal.js.

---

## Claude's Discretion

- Exact dark red color values (should match .dead-state palette from Phase 9)
- CSS transition when defeat screen replaces summary content
- Internal variable naming for defeat flag in battleModal.js

## Deferred Ideas

- None
