# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 01-foundation
**Areas discussed:** Existing saves, Storage layer, Module split depth

---

## Existing Saves

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve them | ALTER TABLE adds column with NULL default — existing rows keep data | |
| Recreate the DB | Drop and recreate — loses current saves, start fresh | ✓ |

**User's choice:** Recreate the DB
**Notes:** Existing game saves are not worth preserving. Clean schema recreation is preferred over migration complexity.

---

## Storage Layer

### Question 1: Migrate storage.js?

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate now | Update storage.js to use /api/sessions/{book} — mechanics_json flows correctly from day one | ✓ |
| Extend the shim | Add mechanics to /api/state blob — less disruption but keeps legacy layer alive | |
| Keep shim as-is | Leave storage.js alone in Phase 1; handle mechanics separately in Phase 2+ | |

**User's choice:** Migrate now

### Question 2: What happens to the compat shim?

| Option | Description | Selected |
|--------|-------------|----------|
| Delete it | Remove compat.py and /api/state route — clean break, no dead code | ✓ |
| Keep but deprecate | Leave in place but don't update | |

**User's choice:** Delete the compat shim entirely

---

## Module Split Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Standard | Extract ui/stats.js + create empty ui/ shells for charCreate, battle, diceRoller | ✓ |
| Minimal | Just extract ui/stats.js — smallest change, lowest risk | |
| Thorough | Full refactor: stats, book modal, init flow, event binding | |

**User's choice:** Standard
**Notes:** Clean boundaries without rewriting working code. Empty shells establish module contracts for Phase 2-3 to implement.

---

## Claude's Discretion

- Exact fetch call shape for migrated storage.js
- Whether to add character `name` field to Session model now (needed Phase 2) or defer

