/**
 * Battle modal overlay — creates/destroys modal on open/close.
 * Follows charCreate.js pattern: create-on-open, destroy-on-close.
 * Does NOT import app.js (D-17 / D-09 pattern).
 */

import { renderBattle } from './battle.js';

// Module-level state
let savedScroll = 0;
let combatActive = false;
let escHandler = null;
let overlayRef = null;
let postCombatPending = false;
let onModalCloseCallback = null;

/**
 * Trigger shake animation on modal element.
 * Uses void offsetWidth reflow to re-trigger if already shaking.
 * @param {HTMLElement} overlay
 */
function triggerShake(overlay) {
    const modal = overlay.querySelector('.modal');
    if (!modal) return;
    modal.classList.remove('modal--shake');
    void modal.offsetWidth; // Force reflow to re-trigger animation
    modal.classList.add('modal--shake');
    modal.addEventListener('animationend', () => {
        modal.classList.remove('modal--shake');
    }, { once: true });
}

/**
 * Teardown: remove overlay, restore scroll, return focus.
 * Order matters (iOS Safari): remove overlay FIRST, then un-fix body, then restore scroll.
 * @param {HTMLElement} overlay
 */
function teardown(overlay) {
    overlay.remove();
    document.body.style.cssText = '';
    window.scrollTo(0, savedScroll);
    overlayRef = null;
    combatActive = false;
    postCombatPending = false;

    // Return focus to Start Battle button (Focus Management Contract)
    document.getElementById('start-battle-btn')?.focus();

    onModalCloseCallback?.();
    onModalCloseCallback = null;
}

/**
 * Open the battle modal overlay.
 * Creates the overlay element, appends to document.body, and initialises
 * the battle UI inside it via renderBattle().
 *
 * @param {Function} getState - Returns { state, combatState, currentBook }
 * @param {Object} callbacks - { onStart, onRollRound, onFlee, onEnd, onStatSync, onCombatEnd, onTestLuck, onCombatStateChange }
 */
export function openBattleModal(getState, callbacks) {
    // Scroll lock (D-03): save position and fix body
    savedScroll = window.scrollY;
    onModalCloseCallback = callbacks.onModalClose ?? null;
    document.body.style.cssText = `position:fixed; top:-${savedScroll}px; width:100%;`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active modal-overlay--opening';
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

    // Store overlay reference before appending
    overlayRef = overlay;

    document.body.appendChild(overlay);

    // Remove opening animation class after animation completes
    const modal = overlay.querySelector('.modal');
    if (modal) {
        modal.addEventListener('animationend', () => {
            overlay.classList.remove('modal-overlay--opening');
        }, { once: true });
    }

    // Focus management (D-06): focus enemy name input after paint
    requestAnimationFrame(() => {
        overlay.querySelector('#enemy-name')?.focus();
    });

    // Wrap callbacks to intercept onCombatStateChange (D-01)
    const wrappedCallbacks = {
        ...callbacks,
        onCombatStateChange: (active) => {
            if (combatActive && !active) {
                postCombatPending = true;
            }
            combatActive = active;
            callbacks.onCombatStateChange?.(active);
        },
        onClose: () => {
            postCombatPending = false;
            closeBattleModal();
        }
    };

    // Escape dismiss guard (D-02)
    escHandler = (e) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        if (combatActive || postCombatPending) {
            triggerShake(overlay);
        } else {
            closeBattleModal();
        }
    };
    document.addEventListener('keydown', escHandler);

    // Backdrop click dismiss guard (D-02)
    overlay.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        if (combatActive || postCombatPending) {
            triggerShake(overlay);
        } else {
            closeBattleModal();
        }
    });

    // Pass the inner .battle-modal div (not the overlay) as container to renderBattle.
    const modalEl = overlay.querySelector('.battle-modal');

    // History container remains in index.html outside the modal.
    const historyContainer = document.getElementById('combat-history');

    renderBattle(modalEl, getState, wrappedCallbacks, historyContainer);
}

/**
 * Close the battle modal overlay.
 * Removes Escape handler, plays fade-out animation (unless reduced-motion),
 * then calls teardown to remove DOM, restore scroll, and return focus.
 */
export function closeBattleModal() {
    const overlay = overlayRef;
    if (!overlay) return;

    // Remove Escape handler
    if (escHandler) {
        document.removeEventListener('keydown', escHandler);
        escHandler = null;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
        teardown(overlay);
        return;
    }

    overlay.classList.add('modal-overlay--closing');
    overlay.addEventListener('animationend', () => teardown(overlay), { once: true });
}
