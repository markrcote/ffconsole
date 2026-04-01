# Coding Conventions

_Last updated: 2026-04-01_

## Summary

The codebase uses vanilla JS ES modules on the frontend and FastAPI/SQLAlchemy on the backend. No linting or formatting tooling is configured — conventions are inferred from the existing code. Python follows standard snake_case/PEP 8; JavaScript follows camelCase with JSDoc comments on every exported function. Both sides share a design principle: modules receive state and callbacks as arguments rather than importing from each other, to avoid circular dependencies.

---

## Naming Patterns

### JavaScript

**Files:** `camelCase.js` for all JS files (`app.js`, `dice.js`, `storage.js`, `charCreate.js`, `diceRoller.js`). UI modules live in `js/ui/`.

**Functions:** `camelCase` for all functions. Exported functions use descriptive verb-noun names: `renderStat`, `bindStatEvents`, `showCharCreate`, `rollCombatRound`, `loadCombatHistory`. Private helpers within a module use the same pattern: `startHold`, `cancelHold`, `splitRoll`, `updateStaminaBars`.

**Variables:** `camelCase`. State-shaped objects use short names: `state`, `games`, `combatState`, `enemy`. Local DOM refs use a consistent `El` suffix: `rollBtn`, `confirmBtn`, `errorEl`, `warningEl`, `statusEl`, `roundResultEl`.

**Constants:** `UPPER_SNAKE_CASE` for module-level constants: `HOLD_DURATION`, `STORAGE_KEY`, `CONFIG_REGISTRY`.

**Private-by-convention:** Internal functions not exported have no special prefix. The one exception is `_applyNewCharacter` and `_now` which use a leading underscore to signal "internal, not for external callers."

### Python

**Files:** `snake_case.py` (`sessions.py`, `actions.py`, `database.py`, `models.py`, `schemas.py`).

**Functions:** `snake_case` for all functions and methods (`list_sessions`, `create_session`, `get_session`, `upsert_session`, `patch_session`, `delete_session`, `post_action`, `get_logs`).

**Private helpers:** Leading underscore prefix: `_now()` (duplicated identically in `sessions.py` and `actions.py`), `_get_session_or_404()`.

**Classes:** `PascalCase` for Pydantic models and SQLAlchemy models: `StatBlock`, `SessionCreate`, `SessionResponse`, `SessionUpdate`, `ActionRequest`, `ActionLogResponse`, `ActionResult`, `Session`, `ActionLog`.

**ORM columns:** `snake_case` with underscore-separated compound names: `book_number`, `skill_initial`, `skill_current`, `stamina_initial`, `stamina_current`, `luck_initial`, `luck_current`, `mechanics_json`, `updated_at`, `created_at`.

---

## Module Design

### JavaScript

**No circular imports** is an explicit, enforced constraint. UI modules (`js/ui/*.js`) must not import `app.js`. State and callbacks flow downward as function arguments.

Pattern: pass a `getState` accessor function (not a snapshot) so UI modules always read current state:
```js
// app.js → ui/battle.js
renderBattle(container, () => ({ state, combatState, currentBook }), { onStart, onRollRound, ... });
```

Pattern: pass a callbacks object for all write-back operations:
```js
// app.js → ui/stats.js
bindStatEvents(() => state, { onModify: modifyStat });
```

**Exports:** Named exports only (no default exports). Each module exports only its public API explicitly at the bottom or inline with `export function`. `js/dice.js` uses bottom-of-file `export { roll, rollMultiple, rollInitialStats }`. All UI modules use `export function` inline.

**Import ordering:** Third-party/sibling modules first, then same-directory imports. Example from `app.js`:
```js
import { rollInitialStats } from './dice.js';
import { save, load } from './storage.js';
import { BOOKS, getBook, searchBooks } from './books.js';
import { testLuck, startCombat, rollCombatRound, endCombat } from './mechanics.js';
import { renderStats, renderStat, bindStatEvents } from './ui/stats.js';
```

### Python

**Router modules** (`backend/routers/`) use a flat `router = APIRouter()` pattern with no class wrappers. All route functions are module-level.

**Dependency injection** via FastAPI's `Depends(get_db)` — every route function that needs the DB receives `db: DBSession = Depends(get_db)`. Never access `SessionLocal` directly in route handlers.

**No `compat.py` router** is present in the main branch (it was documented in CLAUDE.md but `backend/routers/compat.py` is not in the current file tree).

---

## JSDoc / Docstrings

### JavaScript

Every exported function has a JSDoc comment. Private helpers also have JSDoc. Parameters use `@param {Type} name - description` and return values use `@returns {Type} description`.

```js
/**
 * Roll a single die with the specified number of sides
 * @param {number} sides - Number of sides on the die (default: 6)
 * @returns {number} Random value from 1 to sides
 */
function roll(sides = 6) { ... }
```

Module-level file doc comments describe purpose and constraints (e.g., "Does NOT import app.js").

### Python

No docstrings on route functions. Private helpers like `_get_session_or_404` have no docstring. Schemas have no docstrings. This is a gap — Python code has no inline documentation.

---

## Error Handling

### JavaScript — Network calls

All `fetch` calls are wrapped in `try/catch`. On failure, log to `console.error` and continue with a safe fallback. Never throw to the caller from a network function.

Pattern in `js/mechanics.js`:
```js
async function postAction(bookNumber, actionType, details) {
    try {
        const res = await fetch(...);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
```

Callers check for `null` return: `result?.session ?? null`.

Pattern in `js/storage.js` — dual-layer error handling: localStorage errors are caught separately from server errors, each logged independently:
```js
try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
} catch (e) {
    console.error('Failed to save to localStorage:', e);
}
// ... then separately:
try {
    const response = await fetch(...);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
} catch (e) {
    console.error('Failed to save to server:', e);
}
```

History/non-critical paths fail silently (no `console.error`): `js/ui/battle.js loadCombatHistory` catches and sets `innerHTML = ''`.

### Python — HTTP errors

Use `HTTPException` with explicit status codes. 404 via `raise HTTPException(status_code=404, detail=...)`. 409 for duplicate creation. Helper `_get_session_or_404()` in `actions.py` extracts the repeated pattern.

Standard HTTP status codes are referenced via `fastapi.status` constants for POST 201 and DELETE 204. GET/PUT/PATCH use bare integer 404.

### Python — No uncaught exceptions

Route functions don't wrap DB calls in try/except — SQLAlchemy errors propagate as 500s. No custom error handling for DB failures.

---

## State Shape

The canonical game state object shape (used in both JS and as API response) is:
```js
{
    skill:   { initial: number, current: number },
    stamina: { initial: number, current: number },
    luck:    { initial: number, current: number },
    mechanics: {},        // book-specific extras, defaults to {}
    name: string | null,  // character name, optional
}
```

The `mechanics` field defaults to `{}` and is serialized as JSON in the DB column `mechanics_json`. When reading from the ORM, `json.loads(data.mechanics_json or '{}')` is used consistently.

Timestamps are stored as ISO-format strings (`datetime.now(timezone.utc).isoformat()`) in `Text` columns, not as SQL `DATETIME` types. Both `created_at` and `updated_at` follow this pattern.

---

## HTML Templating

JavaScript UI modules build HTML strings via template literals and assign to `innerHTML` or `insertAdjacentHTML`. No DOM builder libraries are used.

Pattern:
```js
list.innerHTML = results.map(book => `
    <li class="book-item ${hasGame ? 'has-game' : ''}" data-number="${book.number}">
        ...
    </li>
`).join('');
```

CSS classes follow a modified BEM pattern for component elements: `combat-round-card__header`, `combat-round-card__outcome--player_hit`, `stamina-bar__fill--critical`. Component names are hyphen-kebab; element separator is `__`; modifier separator is `--`.

---

## DOM Interaction Patterns

**Always guard DOM lookups:** Every `document.getElementById` result is null-checked before use:
```js
const el = document.getElementById('foo');
if (el) el.textContent = value;
```

**Optional chaining for nullable elements:** `document.getElementById('foo')?.addEventListener(...)`.

**Event delegation** is used for list items: click handlers on the parent `<ul>` use `e.target.closest('.book-item')`.

**Long-press (hold) timing** is implemented with `setTimeout` at 500ms (`HOLD_DURATION` constant). The timer ID is stored in a module-level `holdTimers` object keyed by stat name.

---

## CSS Conventions

No CSS preprocessor. Single stylesheet at `css/style.css`. Class naming follows BEM-influenced conventions (see above). State classes are toggled via `classList.toggle(class, condition)` and `classList.add/remove`. Hidden elements use the `hidden` attribute (HTML boolean) not `display:none`, except for some inline styles on dynamically created modal content.

---

## Gaps & Unknowns

- **No linter configured.** No `.eslintrc`, `biome.json`, or `pyproject.toml` with ruff/flake8 settings. Consistency is maintained by convention only.
- **No formatter configured.** No `.prettierrc` or `black` config. Indentation is 4 spaces in Python and 4 spaces in JS (observed consistently, not enforced).
- **Python docstrings absent.** Route functions and schema classes have no docstrings. Only JS functions are documented.
- **`_now()` duplicated.** Identical helper defined in both `backend/routers/sessions.py` and `backend/routers/actions.py` rather than shared from a utility module.
- **No TypeScript.** JS has no static type checking; JSDoc types are documentation only.
- **`compat.py` router** is referenced in CLAUDE.md but is not present in the current codebase.
