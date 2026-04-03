/**
 * Battle modal overlay — creates/destroys modal on open/close.
 * Follows charCreate.js pattern: create-on-open, destroy-on-close.
 * Does NOT import app.js (D-17 / D-09 pattern).
 */

import { renderBattle } from './battle.js';

/**
 * Open the battle modal overlay.
 * Creates the overlay element, appends to document.body, and initialises
 * the battle UI inside it via renderBattle().
 *
 * @param {Function} getState - Returns { state, combatState, currentBook }
 * @param {Object} callbacks - { onStart, onRollRound, onFlee, onEnd, onStatSync, onCombatEnd, onTestLuck }
 */
export function openBattleModal(getState, callbacks) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal battle-modal">
            <h2 class="modal-title">Combat</h2>
            <div class="combat-setup" id="combat-setup">
                <div class="combat-input-row">
                    <label class="combat-label" for="enemy-name">Enemy</label>
                    <input type="text" class="combat-input" id="enemy-name" placeholder="Name">
                </div>
                <div class="combat-input-row">
                    <label class="combat-label" for="enemy-skill">Skill</label>
                    <input type="number" class="combat-input combat-input--stat"
                           id="enemy-skill" min="1" max="20" value="8">
                </div>
                <div class="combat-input-row">
                    <label class="combat-label" for="enemy-stamina">Stamina</label>
                    <input type="number" class="combat-input combat-input--stat"
                           id="enemy-stamina" min="1" max="30" value="8">
                </div>
                <button class="mechanic-btn mechanic-btn--primary" id="start-combat">
                    Start Combat
                </button>
            </div>
            <div class="combat-active" id="combat-active" hidden>
                <p class="combat-status" id="combat-status"></p>
                <div class="stamina-bar-group" id="combat-stamina-bars">
                    <div class="stamina-bar-row">
                        <span class="stamina-bar-label">You</span>
                        <div class="stamina-bar" id="player-stamina-bar"
                             role="progressbar" aria-valuemin="0" aria-valuemax="20" aria-valuenow="20">
                            <div class="stamina-bar__fill stamina-bar__fill--player"
                                 id="player-stamina-fill"></div>
                        </div>
                        <span class="stamina-bar-value" id="player-stamina-value"></span>
                    </div>
                    <div class="stamina-bar-row">
                        <span class="stamina-bar-label" id="enemy-stamina-label">Enemy</span>
                        <div class="stamina-bar" id="enemy-stamina-bar"
                             role="progressbar" aria-valuemin="0" aria-valuemax="8" aria-valuenow="8">
                            <div class="stamina-bar__fill stamina-bar__fill--enemy"
                                 id="enemy-stamina-fill"></div>
                        </div>
                        <span class="stamina-bar-value" id="enemy-stamina-value"></span>
                    </div>
                </div>
                <div id="combat-round-result"></div>
                <p class="mechanic-result" id="combat-result" aria-live="polite"></p>
                <div class="combat-actions">
                    <button class="mechanic-btn mechanic-btn--primary" id="roll-round">Roll Round</button>
                    <button class="mechanic-btn" id="flee-combat">Flee</button>
                </div>
                <div id="combat-summary" hidden></div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Pass the inner .battle-modal div (not the overlay) as container to renderBattle.
    // This matches the existing pattern where renderBattle() was passed .combat-section.
    const modalEl = overlay.querySelector('.battle-modal');

    // History container remains in index.html outside the modal.
    const historyContainer = document.getElementById('combat-history');

    renderBattle(modalEl, getState, callbacks, historyContainer);
}

/**
 * Close the battle modal overlay.
 * Phase 7 implements full teardown (overlay.remove(), scroll unlock, etc.)
 */
export function closeBattleModal() {
    // Phase 7 implements teardown
}
