# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-02
**Phases:** 4 | **Plans:** 17 | **Timeline:** ~53 days (2026-02-08 → 2026-04-02)

### What Was Built

- Full character creation flow with animated dice (4 dice, individual face values), book search, name entry, and per-book mechanic initialization
- Test Your Luck with clear Lucky/Unlucky result display and die face values shown
- Standalone dice roller widget (1d6 / 2d6) with individual face display
- Round-by-round battle system: enemy entry, Attack Strength resolution, live Stamina bars, flee mechanic, post-battle summary, persistent combat log via ActionLog backend
- Book 17 (Appointment with F.E.A.R.): Hero Points, Superpower picker, freeform Clues list
- Book 30 (Chasms of Malice): Kuddam named enemy checklist (7 enemies), Tabasha Skill/Luck picker with one-time restore, freeform Spells/Special Abilities, Cyphers textarea, Provisions/Fuel counters

### What Worked

- **D-17 module pattern** (state + callbacks as arguments, no circular imports) was established early and held cleanly across all UI modules — zero circular import issues across 17 plans
- **Config-driven mechanics renderer** — building `renderBookMechanics()` as a pure function taking config shape meant book configs are just data files; adding a new book requires no renderer changes for standard field types
- **Incremental CSS approach** — each phase added CSS in its own plan, never breaking existing styles; zero regressions across all phases
- **Backend mechanics_json as open-ended blob** — avoided all schema migrations when new field types (freeformLists, tabasha, textareas) were added in the book config correction

### What Was Inefficient

- **Book config field types were wrong at first** — initial implementation used predefined checklists for Clues (Book 17) and numeric stats for Kuddam/Tabasha (Book 30). Required a full correction pass (quick plan 260402-63x). Root cause: placeholder data designed without access to the actual books
- **charCreate async IIFE** — the superpower picker used an unhandled async IIFE that silently swallowed errors; this went undetected until the human verification checkpoint. A `.then().catch()` pattern would have surfaced errors earlier
- **Phase 4 was undercounted** — the plan checker noted the superpower check condition but the silent failure mode wasn't caught until after execution. Browser testing should happen earlier in the verification cycle

### Patterns Established

- **D-17 module pattern**: all `js/ui/*.js` modules receive `state` and `callbacks` as function arguments — never import `app.js`
- **Config field types** for book mechanics: `extraStats`, `resources`, `namedChecklists`, `freeformLists`, `tabasha`, `textareas`, `superpower` — renderer handles each type; adding a new type requires only renderer + CSS additions
- **State key naming conventions**: `stat_{id}`, `resource_{id}`, `checklist_{listId}_{itemId}`, `freeformList_{id}` (array), `textarea_{id}` (string), `tabasha` (object), `superpower` (string)
- **onTabashaRestore callback pattern**: renderer signals app.js to restore a stat without importing it — generalizable to any "restore" mechanic in future books
- **Generic picker step** in charCreate: one `#cc-superpower-step` div handles both superpower (Book 17) and tabasha attribute (Book 30) — any future book with a char-create choice reuses the same UX

### Key Lessons

1. **Verify human-facing flows before closing a plan** — the superpower picker was never browser-tested after implementation. Checkpoint gates should include "open the browser and click through the new feature", not just automated checks
2. **Research actual book content before writing config placeholders** — "Clue 1"…"Clue 8" predefined items vs freeform add/delete list is a fundamental UX difference, not a minor correction. For any book mechanic, establish the actual in-book behaviour before designing the config shape
3. **Unhandled promises are invisible bugs** — async IIFEs that don't catch errors are the JS equivalent of swallowing exceptions. Always use `.then().catch()` or `try/catch` in async code paths that affect UI state

### Cost Observations

- 4 phases, 17 plans, 116 commits over ~53 days
- All phases completed without major architectural pivots — D-17 pattern established in Phase 1 held to completion
- Book config correction (quick plan 260402-63x) added ~450 LOC but was the right call — accuracy of game mechanics is the core value

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 4 |
| Plans | 17 |
| Commits | 116 |
| Days | 53 |
| Rework | 1 quick plan (book config corrections) |
