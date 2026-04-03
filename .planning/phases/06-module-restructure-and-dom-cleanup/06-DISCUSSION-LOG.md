# Phase 6: Module Restructure and DOM Cleanup — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-03
**Phase:** 6 — Module Restructure and DOM Cleanup

---

## Gray Areas Selected

User selected all four gray areas for discussion:
1. "Start Battle" trigger visual
2. battle.js migration scope
3. battleModal.js skeleton contents
4. index.html cleanup

---

## Area 1: "Start Battle" Trigger Visual

**Q:** What does the adventure sheet look like after the inline combat panel is removed?

**Options presented:**
- Just a button (full-width primary in its own section)
- Button + enemy name input (keep name field inline)
- Icon/card trigger
- You decide

**User selected:** Just a button, but put it with the Test Luck button (grouped in same section to save space)

**Follow-up Q:** The "Test Luck" section is currently called "Tests". What should the renamed section be called?

**Options presented:** Actions / Mechanics / You decide

**User selected:** Actions

---

## Area 2: battle.js Migration Scope

**Q:** How much of battle.js do we migrate in Phase 6?

**Options presented:**
- Full migration (all 15+ document.getElementById() → container.querySelector())
- Setup form only (just what's needed for MODAL-03)
- You decide

**User selected:** Full migration (Recommended)

---

## Area 3: battleModal.js Skeleton Contents

**Q:** What should the Phase 6 skeleton include?

**Options presented:**
- Setup form + hidden stubs for active combat + summary (full structure)
- Setup form only
- You decide

**User selected:** Setup form + hidden stubs (Recommended)

---

## Area 4: index.html Cleanup

**Q:** After Phase 6, what stays in the combat-section of index.html?

**Options presented:**
- Remove entirely
- Keep combat history section only (combat-section removed, history section stays — effectively same as remove entirely since history is already its own section)
- Comment it out

**User selected:** Keep combat history section only

*Interpretation: The `combat-section` block is removed from index.html. The `combat-history-section` (already a separate section) remains untouched.*

---

## Completion

**Q:** Anything else to clarify, or ready to write context?

**User selected:** I'm ready for context
