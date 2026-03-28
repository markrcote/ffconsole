# Features Research — FF Console

**Domain:** Fighting Fantasy companion web app
**Date:** 2026-03-28

---

## Table Stakes

Features that make the app useless without them:

### Character Creation
- Visible dice roll with individual die values shown (not just totals)
- Name entry before starting adventure
- Book selection to activate book-specific mechanics
- Stats generated per FF rules: Skill 1d6+6, Stamina 2d6+12, Luck 1d6+6

### Battle System
- Complete round-by-round log with full Attack Strength breakdown (player roll, enemy roll, who won, damage dealt)
- Log persists to backend — available when switching devices or returning to a session
- Live Stamina display for both player and enemy during combat
- Post-battle summary (won/fled/lost, rounds taken, damage dealt/received)
- Enemy entry: name, Skill, Stamina before combat starts

### Test Your Luck
- Clear Lucky/Unlucky result display
- New Luck value shown immediately after test
- Luck decreases by 1 regardless of outcome (already correct in codebase)

### Dice Roller
- 1d6 and 2d6 with individual die values shown (not just sum)
- Available at any time, not locked to a combat state

---

## Differentiators

Features that make this better than pen and paper:

- **Full AS breakdown in log** — shows each player and enemy roll per round, not just outcome
- **Visual enemy Stamina bar** — instant sense of progress during long fights
- **Book-specific mechanics** — automatic extra stat/resource sections for supported books
- **Flee penalty** — -2 Stamina on flee (currently unimplemented in the codebase)
- **Provisions tracker** — common FF mechanic, book-config-driven
- **Combat history** — review previous battles from the session, persisted server-side

---

## Book-Specific Mechanics (Built-in Configs)

### Book 17: Appointment with F.E.A.R.
- Extra stats: Hero Points (starts at 0, earned through adventure)
- Superpower choice at character creation (affects available abilities)
- Clue tracking

### Book 30: Chasms of Malice
- Kuddam defeats counter
- Special abilities tracker
- Provisions, Fuel
- Tabasha the Bazouk restoration tracker
- Spells list

### Book 13: Freeway Fighter
- Body Points (vehicle HP, separate from player Stamina)
- Fuel resource
- Ammo resource
- Combat variant: vehicle combat (uses different AS calculation)
- Combat variant: hand fighting, shooting

---

## MVP Order

1. Character creation (highest user-visible value, prerequisite for meaningful play)
2. Battle log panel (most-requested missing feature; current UI overwrites single text node)
3. Test Your Luck UI polish (mechanic exists, needs clearer result display)
4. Standalone dice roller (simple, rounds out core mechanics)
5. Book config: Appointment with F.E.A.R. (book 17 — simpler extra stats)
6. Book config: Chasms of Malice (book 30 — more stats/resources)
7. Book config: Freeway Fighter (book 13 — most complex, different combat math)

---

## Anti-Features (Deliberate Exclusions)

| Feature | Why excluded |
|---------|-------------|
| User-configurable book mechanics | Scope — defer to future milestone |
| Animated 3D dice | Numbers are what matter; animation adds complexity not value |
| Undo/redo system | Manual stat adjustment covers the need |
| Paragraph tracker | Story navigation is in the book, not the app |
| Sound effects | Scope |
| Multiplayer / shared sessions | Single-player; each session belongs to one adventurer |
| Non-FF gamebook systems | Out of scope |

---

## FF Rules Reference

| Rule | Detail |
|------|--------|
| Combat | 2d6 + Skill = Attack Strength; higher AS wins; 2 Stamina damage to loser; tie = no damage |
| Flee | Lose 2 Stamina; enemy may get a free attack (book-dependent) |
| Test Luck | Roll 2d6; ≤ current Luck = Lucky; Luck -1 regardless of outcome |
| Provisions | Restore 4 Stamina (cannot exceed initial); 1 use per meal |
| Freeway Fighter | Firepower (not Skill) used for ranged AS calculation |
| AFEAR | Hero Points awarded for defeating enemies and finding clues |

---

*Research date: 2026-03-28*
