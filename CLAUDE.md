# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Fighting Fantasy Adventure Sheet web app - a static HTML/CSS/JS application for tracking character stats (Skill, Stamina, Luck) during Fighting Fantasy gamebook adventures.

## Development

This is a static web app with no build step. To run locally, serve the directory with any static file server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000 in a browser.

## Architecture

**Entry point:** `index.html` loads `js/app.js` as an ES module.

**JavaScript modules (`js/`):**
- `app.js` - Main application: state management, DOM rendering, event binding. Manages the game state object containing skill/stamina/luck with initial and current values.
- `dice.js` - Dice rolling utilities. `rollInitialStats()` generates starting stats per FF rules (skill: 1d6+6, stamina: 2d6+12, luck: 1d6+6).
- `storage.js` - LocalStorage persistence using key `ffconsole_gamestate`.

**Key behaviors:**
- Stats cannot go below 0
- Normal +/- buttons keep current value at or below initial
- Long-press (500ms) on + button allows "bonus" increases above initial value
- State auto-saves to localStorage on every change
