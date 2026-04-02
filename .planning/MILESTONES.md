# Milestones

## v1.0 MVP (Shipped: 2026-04-02)

**Phases completed:** 5 phases, 17 plans, 25 tasks

**Key accomplishments:**

- FastAPI Session model extended with mechanics_json TEXT column; compat layer fully deleted; all CRUD endpoints now persist and return open-ended mechanics dict
- Dynamic import config registry with getBookConfig() loader and CSS touch-action fix for 300ms mobile tap delay
- storage.js migrated to /api/sessions with mechanics field; app.js refactored to delegate stat rendering to ui/stats.js with no circular imports
- `name` field wired through full Pydantic schema and session PUT/PATCH pipeline so character names persist to SQLite via /api/sessions
- 195 lines of additive CSS delivering all nine Phase 2 component classes: die face bubble, luck result family, char creation rows, and dice roller layout — zero existing rules modified
- Self-contained `showCharCreate` modal: book search, individual die face animation (4 dice, 600ms each), overwrite protection, and name input with null passthrough to onComplete
- Self-contained renderDiceRoller(container) widget using roll() from dice.js — Roll d6 shows one .die-face, Roll 2d6 shows two .die-face bubbles and a .dice-total sum
- All Phase 2 features wired into index.html and app.js: showCharCreate replaces showBookModal, die-face luck test display, char name rendering, and dice roller initialization
- `load()` now returns null immediately when backend responds 200 with empty sessions, preventing stale localStorage state from blocking the character creation modal.
- Flee combat now deducts 2 Stamina server-side atomically via combat_end handler, preventing stat divergence on device switch or reload
- Battle UI CSS added to style.css: stamina progress bars with fill transitions, round result cards, post-battle summary panel, and collapsible combat history log
- HTML containers added to index.html: ARIA stamina bars for player and enemy, round result card div, hidden post-battle summary panel, and persistent Battle History section
- Self-contained battle.js with stamina bars, round cards with die faces, flee/end flow, post-battle summary, and collapsible history panel fetched from the backend
- Config data layer for Books 17 and 30 — extraStats, checklists, superpower, resources — plus all CSS classes needed for the book mechanics renderer
- bookMechanics.js renderer module + charCreate.js superpower picker step wiring all four mechanic types (extraStats, resources, checklists, superpower) into Book 17 and Book 30 UIs
- Full end-to-end wiring: book-mechanics-section in HTML, renderBookMechanics import and call in app.js, superpower persistence, mechanics save/load

---
