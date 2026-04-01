# Phase 4: Book Configs — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 04-book-configs
**Areas discussed:** Superpower selector, Spells & Special Abilities, Clue & Tabasha trackers, Section placement

---

## Superpower Selector

| Option | Description | Selected |
|--------|-------------|----------|
| In char creation | Extra step in charCreate flow after name entry; value stored in mechanics.superpower before finalising | ✓ |
| On the adventure sheet | Selector widget in book-mechanics section; changeable at any time | |
| You decide | Claude picks whichever integrates most cleanly | |

**User's choice:** In char creation
**Notes:** charCreate.js will need a new step that detects `config.superpower` and renders the picker.

---

## Superpower Options

| Option | Description | Selected |
|--------|-------------|----------|
| Use the real book list | Psi-Powers, Energy Blast, Flying, Super Strength, Laser Vision | ✓ |
| Generic placeholders | Power 1 through 5 | |
| You decide | Claude picks a reasonable default | |

**User's choice:** Use the real book list (Psi-Powers, Energy Blast, Flying, Super Strength, Laser Vision)

---

## Spells List (Book 30)

| Option | Description | Selected |
|--------|-------------|----------|
| Named checklist | Real spell names from the book, each with a checkbox | ✓ |
| Simple counter | Just a number — "Spells remaining: N" | |
| You decide | Claude picks the most appropriate approach | |

**User's choice:** Named checklist

---

## Special Abilities (Book 30)

| Option | Description | Selected |
|--------|-------------|----------|
| Named checklist | Specific ability names from the book, each with a checkbox | ✓ |
| Simple counter | Just a count of abilities acquired | |
| You decide | Claude picks the most appropriate approach | |

**User's choice:** Named checklist

---

## Clue Tracker (Book 17)

| Option | Description | Selected |
|--------|-------------|----------|
| Named checklist | 8 real clue names from the book, each checkable | ✓ |
| Simple counter | "Clues found: N/8" | |
| You decide | Claude picks the most appropriate approach | |

**User's choice:** Named checklist

---

## Tabasha Restoration (Book 30)

| Option | Description | Selected |
|--------|-------------|----------|
| Numeric counter | 0–4 stat-style counter showing restoration steps completed | ✓ |
| Named checklist | Checklist of specific restoration steps | |
| You decide | Claude picks the most appropriate approach | |

**User's choice:** Numeric counter (0–4)

---

## Section Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below stats, above Tests | Immediately under Skill/Stamina/Luck; only rendered for supported books | ✓ |
| At the bottom, after Combat History | Appended after all standard sections | |
| You decide | Claude places it where it flows most naturally | |

**User's choice:** Below stats, above Tests section

---

## Claude's Discretion

- CSS styling for book mechanics section
- Exact Hero Points initial value for Book 17
- Whether to add a book-specific subtitle inside the section
- Exact spell/ability/clue names (research from book knowledge or use best available)

## Deferred Ideas

None
