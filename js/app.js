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

// Long-press tracking for bonus increases
const HOLD_DURATION = 500; // ms to hold for bonus increase
let holdTimers = {};

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
 * @param {boolean} allowBonus - Whether to allow increasing above initial
 */
function modifyStat(name, delta, allowBonus = false) {
    const stat = state[name];
    if (!stat) return;

    const newValue = stat.current + delta;

    // Cannot go below 0
    if (newValue < 0) {
        return;
    }

    // Increasing above initial requires allowBonus flag (long-press)
    if (delta > 0 && stat.current >= stat.initial && !allowBonus) {
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
    const valuesEl = document.querySelector(`#${name}-current`)?.parentElement;

    if (currentEl) currentEl.textContent = stat.current;
    if (initialEl) initialEl.textContent = stat.initial;

    // Update button states
    if (decreaseBtn) decreaseBtn.disabled = stat.current <= 0;

    // + button: never disabled, but shows "locked" state when at/above initial
    if (increaseBtn) {
        increaseBtn.disabled = false;
        increaseBtn.classList.toggle('locked', stat.current >= stat.initial);
    }

    // Highlight when above initial (bonus state)
    if (valuesEl) {
        valuesEl.classList.toggle('bonus', stat.current > stat.initial);
    }
}

/**
 * Start hold timer for bonus increase
 * @param {string} name - The stat name
 * @param {HTMLElement} btn - The button element
 */
function startHold(name, btn) {
    // Clear any existing timer
    cancelHold(name);

    const stat = state[name];
    if (!stat || stat.current < stat.initial) {
        return; // Not at limit, no hold needed
    }

    btn.classList.add('holding');
    holdTimers[name] = setTimeout(() => {
        modifyStat(name, 1, true);
        btn.classList.remove('holding');
        btn.classList.add('held');
        holdTimers[name] = null;
    }, HOLD_DURATION);
}

/**
 * Cancel hold timer
 * @param {string} name - The stat name
 */
function cancelHold(name) {
    if (holdTimers[name]) {
        clearTimeout(holdTimers[name]);
        holdTimers[name] = null;
    }
    const btn = document.getElementById(`${name}-increase`);
    if (btn) {
        btn.classList.remove('holding', 'held');
    }
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
            // Click handles normal increases (below initial)
            increaseBtn.addEventListener('click', () => {
                const stat = state[name];
                if (stat && stat.current < stat.initial) {
                    modifyStat(name, 1);
                }
            });

            // Long-press handles bonus increases (at/above initial)
            // Mouse events
            increaseBtn.addEventListener('mousedown', (e) => {
                if (e.button === 0) startHold(name, increaseBtn);
            });
            increaseBtn.addEventListener('mouseup', () => cancelHold(name));
            increaseBtn.addEventListener('mouseleave', () => cancelHold(name));

            // Touch events
            increaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startHold(name, increaseBtn);
            });
            increaseBtn.addEventListener('touchend', () => {
                const stat = state[name];
                // If not held long enough and below initial, do normal increment
                if (holdTimers[name] && stat && stat.current < stat.initial) {
                    modifyStat(name, 1);
                }
                cancelHold(name);
            });
            increaseBtn.addEventListener('touchcancel', () => cancelHold(name));
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
