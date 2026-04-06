---
created: 2026-04-06T22:26:59.668Z
title: Add manual defeated button for instant-death paragraphs
area: ui
files:
  - js/ui/stats.js
  - js/app.js
---

## Problem

Some Fighting Fantasy paragraphs kill the player outright — "You are dead. Your adventure ends here." — without reducing Stamina to 0 through combat or stat adjustments. The v1.2 defeat detection is automatic (Stamina hits 0), but that doesn't cover these instant-death paragraphs.

The player currently has no way to trigger the defeat/dead state without manipulating Stamina to 0 manually, which is awkward and may not reflect the in-book situation.

## Solution

Add a "I'm Dead" / "Defeated" button on the adventure sheet that directly triggers the dead state — same result as Stamina hitting 0, but invoked manually. Should probably live near the stat area or as a secondary action. No undo needed for this path (player is making a deliberate choice).

Integrate with the dead state UI built in Phase 9, reusing the same Restart / Change Book recovery actions.
