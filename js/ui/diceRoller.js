/**
 * Standalone dice roller widget.
 * Phase 2 implementation.
 *
 * renderDiceRoller(container) — renders into the provided section element.
 * Called once from app.js init() with document.getElementById('dice-section').
 * No state, no callbacks. Imports only roll() from dice.js.
 */

import { roll } from '../dice.js';

/**
 * Render the dice roller widget into the given container element.
 * The container is the <section class="mechanics-section dice-section"> element.
 * The section's <h2> title is already in index.html; this function fills the body.
 * @param {HTMLElement} container
 */
export function renderDiceRoller(container) {
    if (!container) return;

    // Build inner HTML: two buttons + result area
    container.insertAdjacentHTML('beforeend', `
        <div class="dice-roller-buttons">
            <button class="mechanic-btn" id="roll-d6">Roll d6</button>
            <button class="mechanic-btn" id="roll-2d6">Roll 2d6</button>
        </div>
        <div class="dice-roller-result" id="dice-roller-result" aria-live="polite"></div>
    `);

    const resultEl = container.querySelector('#dice-roller-result');

    // ── Roll d6 ──────────────────────────────────────────────────────────────
    container.querySelector('#roll-d6').addEventListener('click', () => {
        const value = roll(6);
        // Single die face (DICE-02)
        resultEl.innerHTML = `<span class="die-face">${value}</span>`;
    });

    // ── Roll 2d6 ─────────────────────────────────────────────────────────────
    container.querySelector('#roll-2d6').addEventListener('click', () => {
        const d1 = roll(6);
        const d2 = roll(6);
        const total = d1 + d2;
        // Two die face elements plus total (DICE-02, D-11)
        // Format: [d1] [d2] = total
        resultEl.innerHTML = `
            <span class="die-face">${d1}</span>
            <span class="die-face">${d2}</span>
            <span class="dice-total">= ${total}</span>
        `;
    });
}
