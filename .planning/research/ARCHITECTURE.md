# Architecture Research — FF Console

**Domain:** Vanilla JS gamebook companion — extensible mechanics + battle system
**Date:** 2026-03-28
**Confidence:** HIGH (based on direct codebase analysis)

---

## Current State Assessment

`app.js` currently owns everything: state, rendering, event binding, and combat logic. That worked for the MVP. Adding book-specific mechanics and a turn-by-turn battle panel requires a deliberate module split before adding more.

| File | Current Role | Long-term Role |
|------|-------------|----------------|
| `app.js` | Everything | Orchestrator — state, routing between views |
| `mechanics.js` | API calls for tests + combat | Extend with luck test, standalone dice roller |
| `dice.js` | Pure roll functions | Stable, no change needed |
| `storage.js` | Save/load blob | Extend to persist battle log, book mechanic state |
| `books.js` | Static catalog array | Source of truth for book numbers used as config keys |

---

## Recommended Module Map

```
js/
  app.js              — orchestrator: holds root game state, calls into panels
  dice.js             — pure functions, stable
  storage.js          — persistence (extend blob schema)
  mechanics.js        — all FF rule computations + API calls
  books.js            — catalog + config loader
  ui/
    charCreate.js     — character creation flow (modal)
    battle.js         — battle panel: state + render + events
    diceRoller.js     — standalone dice roller widget
    stats.js          — extracted stat row render/bind (from app.js)
  config/
    mechanics/
      default.js      — base config (skill/stamina/luck only)
      book-13.js      — Freeway Fighter
      book-17.js      — Appointment with F.E.A.R.
      book-30.js      — Chasms of Malice
```

---

## Component Boundaries

| Component | Responsibility | Reads From | Writes To |
|-----------|---------------|-----------|-----------|
| `app.js` | Root state, current book, init, global render | `storage.js`, config loader | root `state`, DOM sections |
| `ui/stats.js` | Render + bind Skill/Stamina/Luck rows | root `state` via argument | DOM only |
| `ui/charCreate.js` | Roll animation, name input, book selection | `dice.js`, `books.js` | calls `onCharCreated(stats, bookNumber)` callback |
| `ui/battle.js` | Battle panel: enemy input, turn log, live trackers | root `state`, `mechanics.js` | local `battleState`, DOM, calls back `onPlayerStaminaChange` |
| `ui/diceRoller.js` | Any-dice roller widget | `dice.js` | DOM only (no state) |
| `mechanics.js` | All rule computations, API POST calls | `dice.js` | returns result objects to callers |
| `books.js` | Catalog + `getBookConfig(number)` | `config/mechanics/*.js` | returns config object |
| `config/mechanics/*.js` | Declarative book-specific data | nothing | static export |

**Key rule:** Data flows top-down. `app.js` owns root state and passes slices down to panels as arguments or exposes narrow callbacks. Panels never import `app.js`.

---

## Book-Specific Config: Data-Driven Config Files

### Config Schema

```javascript
// js/config/mechanics/default.js
export const config = {
    bookNumber: null,
    extraStats: [],      // { id, label, initial, min, max }
    resources: [],       // { id, label, initial, min, max, step }
    combatVariant: 'standard',   // 'standard' | 'vehicle' | 'shooting'
    combatModifiers: {},
};

// js/config/mechanics/book-13.js  (Freeway Fighter)
export const config = {
    bookNumber: 13,
    extraStats: [
        { id: 'bodyPoints', label: 'Body Points', initial: 30, min: 0, max: null },
    ],
    resources: [
        { id: 'fuel', label: 'Fuel', initial: 20, min: 0, max: 20, step: 1 },
        { id: 'ammo', label: 'Ammo', initial: 10, min: 0, max: 20, step: 1 },
    ],
    combatVariant: 'vehicle',
    combatModifiers: { vehicleSkillStat: 'skill' },
};
```

### Config Loader (addition to books.js)

```javascript
const CONFIG_REGISTRY = {
    13: () => import('./config/mechanics/book-13.js'),
    17: () => import('./config/mechanics/book-17.js'),
    30: () => import('./config/mechanics/book-30.js'),
};

export async function getBookConfig(bookNumber) {
    const loader = CONFIG_REGISTRY[bookNumber];
    if (!loader) {
        const { config } = await import('./config/mechanics/default.js');
        return config;
    }
    const { config } = await loader();
    return config;
}
```

Dynamic import is ES2020, universally supported. Configs are lazy-loaded — only downloaded when user selects that book.

---

## Battle State: Where It Lives

Two distinct needs:

1. **Live state** (current round, enemy stamina) — in-memory only in `ui/battle.js`. Resets on page reload, which is acceptable.
2. **Round-by-round log** — persist to existing `ActionLog` model via `/api/sessions/{book}/actions`. Each round POST records full round detail.

```javascript
// Local to ui/battle.js — never persisted
let battleState = {
    active: false,
    round: 0,
    enemy: { name: '', skill: 0, stamina: 0, staminaInitial: 0 },
    log: [],   // round result objects for in-panel display
};
```

On page load: fetch action log from backend to rebuild combat history display. This separates live ephemeral state (in-memory) from persistent history (backend).

---

## Rendering Dynamic UI Without a Framework

### Panel Pattern: innerHTML replacement + delegated events

```javascript
export function renderBattle(container, battleState, playerState) {
    if (!battleState.active) {
        container.innerHTML = setupTemplate();
        bindSetupEvents(container, playerState);
        return;
    }
    container.innerHTML = activeTemplate(battleState, playerState);
    bindActiveEvents(container, battleState, playerState);
}
```

**Rules:**
1. Replace `container.innerHTML` on every state change — no diffing needed for panels this size
2. Always bind events after render using `data-action` attributes + one delegated listener on the container
3. Never bind panel-specific events at `document` level — causes ghost listeners after re-render

### Book Mechanic Sections

Add one empty `<section id="extra-mechanics" hidden></section>` to `index.html`. After book selection, `app.js` loads config and populates it:

```javascript
async function applyBookConfig(bookNumber) {
    const config = await getBookConfig(bookNumber);
    const extraSection = document.getElementById('extra-mechanics');
    if (config.extraStats.length === 0 && config.resources.length === 0) {
        extraSection.hidden = true;
        return;
    }
    extraSection.hidden = false;
    extraSection.innerHTML = renderBookMechanicsSection(config);
    bindBookMechanicsEvents(extraSection, config);
}
```

Using a pre-existing hidden section avoids scroll-jump on mobile when the section appears.

---

## Character Creation Flow

### Modal overlay, not a separate page

The existing `#book-modal` pattern proves this works on mobile. Character creation is a 3-step modal:

1. Book selection (extend or reuse existing modal)
2. Roll stats — animated dice display, rolled values
3. Name entry (optional) + confirm

`ui/charCreate.js` exports `showCharCreate(onComplete)` where `onComplete({ bookNumber, name, stats })` hands control back to `app.js`.

---

## Suggested Build Order

| Step | Component | Why This Order |
|------|-----------|---------------|
| 1 | Config schema + `default.js` + `getBookConfig()` | Establishes data contract; zero UI risk |
| 2 | `book-17.js`, `book-13.js`, `book-30.js` data files | Pure data; fills in before any UI needs it |
| 3 | Extract `ui/stats.js` from `app.js` | Zero user-visible change; cleans up app.js |
| 4 | `ui/charCreate.js` character creation modal | First new visible feature; depends only on `dice.js` + `books.js` |
| 5 | Dynamic extra-mechanics section | Depends on configs (1-2) |
| 6 | `ui/battle.js` full battle panel with round log | Highest-complexity; builds on all prior work |
| 7 | `ui/diceRoller.js` standalone roller | Standalone widget, can slot in any time after step 3 |

---

## Anti-Patterns to Avoid

| Anti-pattern | Problem | Instead |
|---|---|---|
| Battle log in localStorage | Diverges from backend action log on reload | In-memory for live state; backend for persistent log |
| Global document listeners for panel actions | Ghost listeners accumulate after re-render | Delegated listener on container, rebound after innerHTML replace |
| One monolithic configs.js | All configs parsed at startup; file becomes conflict zone | One file per book, lazy-loaded via dynamic import registry |
| Panel modules importing `app.js` | Circular dependency | Pass state slices and callbacks as arguments |

---

*Research date: 2026-03-28 | Confidence: HIGH*
