# Pitfalls Research — FF Console

**Domain:** Vanilla JS combat system, dice UI, extensible mechanic configs
**Date:** 2026-03-28
**Confidence:** HIGH (all findings from direct codebase analysis)

---

## Critical

### Pitfall 1: Split-Brain Combat State

**What it is:** Enemy Stamina lives in client-only `combatState`. Player Stamina lives in the server session. The end-combat check has a broken offline fallback that reads pre-round Stamina.

**Warning signs:** Player Stamina doesn't update visually during combat, or resets to wrong value after combat ends.

**Prevention:** `ui/battle.js` owns all in-combat state. Player Stamina mutations during combat call back to `app.js` via `onPlayerStaminaChange(delta)`, which handles save. Never mutate player stats directly inside the battle module.

**Phase:** Combat implementation phase.

---

### Pitfall 2: Double Stat Mutation on Luck Tests

**What it is:** The luck offline fallback in `mechanics.js` can fire on the same request that the server also applies, decrementing Luck by 2 instead of 1.

**Warning signs:** Luck decreases by 2 when connection is intermittent.

**Prevention:** Optimistic local update only. Apply the stat change locally immediately, POST to server, and on error roll back — never apply server response as an additional delta on top of a local update that already happened.

**Phase:** Luck test implementation (core mechanics phase).

---

### Pitfall 3: Book Mechanic Fields Silently Stripped by Pydantic Schema

**What it is:** The existing Pydantic schema only knows `{ skill, stamina, luck }`. Extra fields from book configs will be silently stripped on every server save/load cycle.

**Warning signs:** Book-specific stats (Hero Points, Fuel, etc.) reset to default on page reload.

**Prevention:** Reserve a `mechanics: {}` sub-object in the state schema before writing any book config. The backend `Session` model needs a `mechanics_json` column (TEXT/JSON) to store arbitrary book state. This must be done before any book config ships.

**Phase:** Config infrastructure phase (Phase 1) — must be solved before book configs are written.

---

## Moderate

### Pitfall 4: Mobile Double-Tap on Combat Buttons

**What it is:** Stat buttons use `e.preventDefault()` on `touchstart` to prevent the 300ms tap delay, but combat buttons don't. On mobile they synthesise a delayed click and fire two rounds.

**Warning signs:** Two rounds resolve on a single tap on mobile.

**Prevention:** Add `touch-action: manipulation` to all interactive buttons in CSS. This is the correct fix — it eliminates the tap delay without requiring JS event handling on every new button.

**Phase:** All phases that add new interactive buttons — must be in base CSS from day one.

---

### Pitfall 5: Animation/Result Race on Dice Rolls

**What it is:** Dice animation plays while the result is already shown. If the roll result updates the DOM before the animation ends, the user sees the answer before the drama resolves.

**Warning signs:** Result number is visible before the animation finishes.

**Prevention:** Hold the roll result in a local variable. Update the DOM only in the `animationend` callback. Add a rolling guard (`isRolling` flag) to prevent double-firing.

**Phase:** Character creation and dice roller phases.

---

### Pitfall 6: innerHTML += on Round Log

**What it is:** `innerHTML +=` re-parses and re-renders the entire log list on every round, clearing and re-adding all DOM nodes. At 10+ rounds this causes visible flicker and loses any event listeners on existing entries.

**Warning signs:** Log flickers on each round; performance degrades in long fights.

**Prevention:** Use `insertAdjacentHTML('beforeend', roundHTML)` to append only the new entry.

**Phase:** Battle panel implementation.

---

### Pitfall 7: Global Event Listeners Accumulating

**What it is:** If panel re-renders add new `document.addEventListener` or `container.addEventListener` calls without removing the old ones, each re-render adds another listener. After 10 rounds, 10 handlers fire per button click.

**Warning signs:** Multiple rounds resolve per click; console shows duplicate events.

**Prevention:** Bind one delegated listener per container immediately after `innerHTML` replacement. Never bind to `document` for panel-specific actions.

**Phase:** All UI panel implementation.

---

## Minor

### Pitfall 8: Combat Log Not Loading on Page Reload

**What it is:** If the round log is rendered only during the live session and not fetched from the backend on load, the "review last fight" feature won't work.

**Warning signs:** Combat history section is empty after page reload.

**Prevention:** On app init, fetch action log from `/api/sessions/{book}/actions` and render any `combat_round` entries into the history display.

**Phase:** Battle panel implementation.

---

### Pitfall 9: Book Config Values Hard-Coded in UI

**What it is:** Rendering book-specific stats with hard-coded labels/IDs in HTML means adding a new book requires HTML changes, not just a new config file.

**Warning signs:** Adding book-14.js config doesn't make the new stats appear.

**Prevention:** The extra-mechanics section must be driven entirely from config data — rendered via `renderBookMechanicsSection(config)` with no book-specific HTML in `index.html`.

**Phase:** Config infrastructure phase.

---

### Pitfall 10: Character Creation Re-Roll Rules Vary by Book

**What it is:** Standard FF rules allow rolling stats once (no re-roll). Some variant books (e.g., Freeway Fighter) differ. Implementing a universal "one re-roll" will be wrong for some books.

**Warning signs:** Character creation allows re-roll on books where the rules don't permit it.

**Prevention:** Add `allowsStatReroll: boolean` to the config schema. Default: false (standard FF). Only set true for books that explicitly allow it.

**Phase:** Character creation phase.

---

*Research date: 2026-03-28 | Confidence: HIGH (codebase analysis)*
