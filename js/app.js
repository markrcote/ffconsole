/**
 * Main application logic for Fighting Fantasy Adventure Sheet
 */

import { rollInitialStats } from './dice.js';
import { save, load, clear } from './storage.js';

// Game state
let state = {
    skill: { initial: 0, current: 0 },
    stamina: { initial: 0, current: 0 },
    luck: { initial: 0, current: 0 }
};

/**
 * Initialize the application
 */
function init() {
    const savedState = load();
    if (savedState) {
        state = savedState;
    } else {
        startNewGame(false);
    }
    render();
    bindEvents();
}

/**
 * Start a new game with freshly rolled stats
 * @param {boolean} confirm - Whether to show confirmation dialog
 */
function startNewGame(confirm = true) {
    if (confirm && !window.confirm('Start a new adventure? Your current progress will be lost.')) {
        return;
    }

    const stats = rollInitialStats();
    state = {
        skill: { initial: stats.skill, current: stats.skill },
        stamina: { initial: stats.stamina, current: stats.stamina },
        luck: { initial: stats.luck, current: stats.luck }
    };
    save(state);
    render();
}

/**
 * Modify a stat by the given delta
 * @param {string} name - The stat name (skill, stamina, luck)
 * @param {number} delta - The change amount (+1 or -1)
 */
function modifyStat(name, delta) {
    const stat = state[name];
    if (!stat) return;

    const newValue = stat.current + delta;

    // Clamp between 0 and initial value
    if (newValue < 0 || newValue > stat.initial) {
        return;
    }

    stat.current = newValue;
    save(state);
    renderStat(name);
}

/**
 * Render all stats to the DOM
 */
function render() {
    renderStat('skill');
    renderStat('stamina');
    renderStat('luck');
}

/**
 * Render a single stat to the DOM
 * @param {string} name - The stat name
 */
function renderStat(name) {
    const stat = state[name];
    if (!stat) return;

    const currentEl = document.getElementById(`${name}-current`);
    const initialEl = document.getElementById(`${name}-initial`);
    const decreaseBtn = document.getElementById(`${name}-decrease`);
    const increaseBtn = document.getElementById(`${name}-increase`);

    if (currentEl) currentEl.textContent = stat.current;
    if (initialEl) initialEl.textContent = stat.initial;

    // Update button states
    if (decreaseBtn) decreaseBtn.disabled = stat.current <= 0;
    if (increaseBtn) increaseBtn.disabled = stat.current >= stat.initial;
}

/**
 * Bind event listeners to buttons
 */
function bindEvents() {
    // Stat adjustment buttons
    ['skill', 'stamina', 'luck'].forEach(name => {
        const decreaseBtn = document.getElementById(`${name}-decrease`);
        const increaseBtn = document.getElementById(`${name}-increase`);

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => modifyStat(name, -1));
        }
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => modifyStat(name, 1));
        }
    });

    // New Adventure button
    const newGameBtn = document.getElementById('new-game');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => startNewGame(true));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
