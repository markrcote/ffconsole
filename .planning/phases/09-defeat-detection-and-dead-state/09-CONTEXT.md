# Phase 9 Context: Defeat Detection and Dead State

**Phase:** 9 — Defeat Detection and Dead State
**Milestone:** v1.2 Defeat State
**Created:** 2026-04-06
**Requirements:** DEFEAT-01, DEFEAT-02, DEFEAT-05, DEFEAT-06, DEFEAT-07
**Scope expanded:** Manual defeat button (folded from todo)

---

## Domain Boundary

Detect stamina-0 defeat everywhere on the sheet (stat buttons + manual button), persist dead status
to the backend, and show a visually unambiguous dead state overlay with Undo (misclick protection)
and Restart / Change Book recovery actions.

Combat defeat detection (DEFEAT-01) is wired here as a signal/callback hook — the full modal defeat
screen is Phase 10's job.

---

## Decisions

### 1. Dead status persistence: `mechanics_json`

Store dead status inside the existing `mechanics_json` blob as `{ ..., dead: true }`.

- No DB migration, no schema changes to Session model or schemas.py
- Works with the existing PATCH endpoint (`/api/sessions/{book}`)
- Read on load via `json.loads(data.mechanics_json or '{}')` — same pattern as all other mechanics
- On Restart, clear `dead` flag (set `dead: false` or remove the key) alongside stat re-roll

**Why not a new `status` column:** Migration overhead not justified; mechanics_json is already the
extension point for session-level state in this codebase.

### 2. Dead state visual: overlay replacement

The adventure sheet is replaced by a dead state overlay — not styled in-place.

Layout (inside existing `.modal-overlay` / `.modal` pattern or a dedicated section):
```
╔═══════════════════╗
║   YOU ARE DEAD    ║
╚═══════════════════╝

Skill:    8 / 10
Stamina:  0 / 20
Luck:     7 / 9
(read-only, no +/- buttons)

[ Restart ]
[ Change Book ]
```

- Stats shown read-only (so the player can see final values)
- All stat +/- buttons hidden/disabled
- Only Restart and Change Book are actionable
- Sheet content underneath is not interactable

**Implementation note:** Prefer a top-level `<section id="dead-state">` in `index.html` (hidden by
default, shown via `hidden` attribute toggle) over a CSS overlay, to match the existing
`#book-mechanics-section` / `#char-create-section` pattern. Do NOT use `.modal-overlay` — dead state
is a persistent app state, not a transient dialog.

### 3. Undo window: auto-dismiss after ~5 seconds

When Stamina hits 0 via sheet stat buttons:
1. Show an "Undo" toast/button immediately (before saving dead state)
2. Auto-dismiss after ~5 seconds → dead state commits and saves
3. If player taps Undo within the window → revert the stat change, no dead state

**Undo flow in `modifyStat()`:**
- Before committing stamina=0 change, store the previous value
- Show Undo UI with a countdown or visual timeout indicator
- On dismiss (timeout or user action) → save `{ dead: true }` to mechanics_json

**No Undo for manual defeat button** — that path is deliberate, skip the window entirely.

### 4. Manual defeat button: folded into Phase 9

A "I'm Dead" button on the adventure sheet triggers dead state directly, covering instant-death
paragraphs where Stamina never actually reaches 0.

- Located on the sheet (near stat area or as a secondary action — planner to decide placement)
- No Undo for this path (deliberate player choice)
- Same dead state overlay and recovery actions as automatic defeat
- Files: `js/ui/stats.js` and `js/app.js` (per todo)

**Scope note:** REQUIREMENTS.md originally listed this as out-of-scope, but the todo was created
the same day. The player experience gap is real — fold it in.

### 5. Combat defeat signal (DEFEAT-01)

Phase 9 adds a hook/callback in the combat flow so Phase 10 can attach the defeat screen.

Specifically: when `stamina_current` reaches 0 for the player during a combat round, the combat
result should include a `defeated: true` flag (or equivalent callback). Phase 9 wires this signal;
Phase 10 handles the modal defeat screen.

The dead state on the sheet (after modal closes) is Phase 10's responsibility — Phase 9 only
provides the detection hook inside combat.

---

## Canonical Refs

- `js/app.js:218` — `modifyStat()` — sheet stat button path, hook point for stamina-0 detection
- `js/mechanics.js` — `rollCombatRound()` — combat round path, hook point for DEFEAT-01
- `js/ui/stats.js` — stat row rendering, may need dead-state disabled variant
- `js/ui/battle.js` — combat UI, may need defeat signal propagation
- `js/ui/battleModal.js` — modal lifecycle, Phase 10 will hook into defeat signal here
- `backend/models.py:25` — `mechanics_json` column — persistence target
- `backend/schemas.py:37` — mechanics deserialization pattern
- `backend/routers/sessions.py` — PATCH endpoint for saving dead status
- `.planning/REQUIREMENTS.md` — DEFEAT-01 through DEFEAT-07
- `.planning/codebase/CONVENTIONS.md` — module patterns, no circular imports, D-17 pattern
- `.planning/codebase/ARCHITECTURE.md` — data flow, state shape

---

## Deferred Ideas

- Multi-step undo (undo history) — explicitly deferred to post-v1.2 per REQUIREMENTS.md
- "New Battle" inside modal without closing — deferred from v1.1
- Session archiving / graveyard — not in scope for v1.2

---

## Folded Todos

- **Add manual defeated button for instant-death paragraphs** (`todos/pending/2026-04-06-add-manual-defeated-button-for-instant-death-paragraphs.md`) — folded into Phase 9 scope (decision 4 above)
