---
phase: 03-battle-system
created: 2026-03-30
source: roadmap
---

# Phase 3: Battle System — Context

## Phase Goal

Users can conduct a full Fighting Fantasy combat — entering an enemy, resolving rounds, and reviewing the log — entirely within the adventure sheet.

## Requirements

- **BATTLE-01**: User can start a battle by entering an enemy's name, Skill, and Stamina
- **BATTLE-02**: User can resolve a combat round with a single roll button that rolls for both player and enemy, calculates Attack Strengths, and determines the winner
- **BATTLE-03**: Each round result is displayed showing: player roll, enemy roll, both Attack Strengths, who won, Stamina damage applied
- **BATTLE-04**: Live Stamina bars for both player and enemy update after each round
- **BATTLE-05**: User can flee combat (player loses 2 Stamina)
- **BATTLE-06**: Combat ends automatically when either side reaches 0 Stamina, displaying a post-battle summary (outcome, rounds, damage dealt/received)
- **BATTLE-07**: Round-by-round log persists to the backend and is visible when returning to a session on any device
- **BATTLE-08**: User can review combat history from previous battles in the current session

## Success Criteria

1. User can enter an enemy name, Skill, and Stamina and start combat without leaving the adventure sheet
2. Each round resolves with a single button tap, showing player roll, enemy roll, both Attack Strengths, who won, and Stamina damage applied
3. Live Stamina bars for both player and enemy update after every round
4. Combat ends automatically at 0 Stamina with a post-battle summary (outcome, rounds fought, damage dealt/received)
5. User can flee combat (player loses 2 Stamina) and the fight ends
6. Reloading the page or switching devices restores the full round-by-round log for the current session

## FF Combat Rules (Standard)

- **Attack Strength** = 2d6 + current Skill
- Player and enemy each roll 2d6 simultaneously
- Higher Attack Strength wins the round
- Tie: no damage, repeat
- Winner deals **2 Stamina damage** to loser
- Combat ends when either side reaches 0 Stamina
- **Flee**: Player can flee; enemy gets one free attack (2 Stamina damage to player), then combat ends

## Key Decisions from STATE.md

- Battle as panel on adventure sheet (not separate screen)
- Both live Stamina tracker + persistent round log
- Confirm `/api/sessions/{book}/actions` POST/GET payload shape before implementing (flagged in research SUMMARY.md)

## Depends On

- Phase 1: `actions.py` router at `/api/sessions/{book}/actions` — POST new action, GET log
- Phase 1: `ui/battle.js` stub exists
- Phase 2: State management patterns from charCreate.js / diceRoller.js
