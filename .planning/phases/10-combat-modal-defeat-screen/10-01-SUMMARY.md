---
plan: 10-01
phase: 10-combat-modal-defeat-screen
status: complete
completed_at: 2026-04-07
---

# Summary: Combat Modal Defeat Screen

## What was built

Implemented the combat modal defeat screen end-to-end:

- **CSS** (`.battle-modal--defeat`): Dark red card (`#3d0e00`) with light parchment text. Overrides all dark-colored combat UI elements inside the modal (status text, stamina bar labels, round card hidden). Summary box rendered transparent against the card.
- **battle.js**: `onPlayerDefeated` now passes `(round, playerStaminaFinal, enemy)` arguments.
- **battleModal.js**: `onPlayerDefeated` handler sets `defeatedThisCombat` flag, adds `.battle-modal--defeat` to modal card, replaces `#combat-summary` innerHTML with defeat screen ("YOU WERE DEFEATED", rounds, stamina, enemy stamina), re-binds close button to `wrappedCallbacks.onClose`.
- **app.js**: `onPlayerDefeated` saves `mechanics.dead = true` immediately (so dead state persists on reload even from the defeat screen). `onModalClose` calls `showDeadStateUI()` when `combatEndedInDefeat` is true.

## Verification

- Automated grep checks: PASS
- Human verification: approved — defeat screen appears with dark red card and light text; "Return to Sheet" closes modal and shows dead state; reloading page preserves dead state.

## Fixes applied during verification

- Added `.battle-modal--defeat .combat-summary__stats` color override (dark ink rule overrode parent)
- Made `.combat-summary` background transparent (was parchment box inside crimson card)
- Added overrides for `.combat-status`, `.stamina-bar-label`, `.stamina-bar-value`, `.mechanic-result`
- Hidden `#combat-round-result` on defeat (round card has own parchment background + dark child colors)
- Moved dead state save from `onModalClose` to `onPlayerDefeated` (reload from defeat screen lost state)
