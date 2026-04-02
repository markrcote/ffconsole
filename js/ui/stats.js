/**
 * Stat row rendering and +/- button event binding.
 * Extracted from app.js per INFRA-03.
 * Does NOT import app.js -- receives state and callbacks as arguments (D-17).
 */

const HOLD_DURATION = 500;
const holdTimers = {};

/**
 * Render a single stat to the DOM.
 * @param {string} name - The stat name (skill, stamina, luck)
 * @param {Object} state - { skill, stamina, luck } each with { initial, current }
 */
export function renderStat(name, state) {
    const stat = state[name];
    if (!stat) return;

    const currentEl = document.getElementById(`${name}-current`);
    const initialEl = document.getElementById(`${name}-initial`);
    const decreaseBtn = document.getElementById(`${name}-decrease`);
    const increaseBtn = document.getElementById(`${name}-increase`);
    const valuesEl = document.querySelector(`#${name}-current`)?.parentElement;

    if (currentEl) currentEl.textContent = stat.current;
    if (initialEl) initialEl.textContent = stat.initial;

    if (decreaseBtn) decreaseBtn.disabled = stat.current <= 0;

    if (increaseBtn) {
        increaseBtn.disabled = false;
        increaseBtn.classList.toggle('locked', stat.current >= stat.initial);
    }

    if (valuesEl) {
        valuesEl.classList.toggle('bonus', stat.current > stat.initial);
    }
}

/**
 * Render all stats.
 * @param {Object} state - { skill, stamina, luck } each with { initial, current }
 */
export function renderStats(state) {
    renderStat('skill', state);
    renderStat('stamina', state);
    renderStat('luck', state);
}

/**
 * Start hold timer for bonus increase.
 * @param {string} name
 * @param {HTMLElement} btn
 * @param {Object} state
 * @param {Function} onModify - (name, delta, allowBonus) => void
 */
function startHold(name, btn, state, onModify) {
    cancelHold(name);

    const stat = state[name];
    if (!stat || stat.current < stat.initial) return;

    btn.classList.add('holding');
    holdTimers[name] = setTimeout(() => {
        onModify(name, 1, true);
        btn.classList.remove('holding');
        btn.classList.add('held');
        holdTimers[name] = null;
    }, HOLD_DURATION);
}

/**
 * Cancel hold timer.
 * @param {string} name
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
 * Bind stat +/- button events.
 * @param {Object} getState() - { skill, stamina, luck } each with { initial, current }
 * @param {{ onModify: (name: string, delta: number, allowBonus?: boolean) => void }} callbacks
 */
export function bindStatEvents(getState, callbacks) {
    ['skill', 'stamina', 'luck'].forEach(name => {
        const decreaseBtn = document.getElementById(`${name}-decrease`);
        const increaseBtn = document.getElementById(`${name}-increase`);

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => callbacks.onModify(name, -1));
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                const stat = getState()[name];
                if (stat && stat.current < stat.initial) {
                    callbacks.onModify(name, 1);
                }
            });

            const state = getState();
            // Long-press for bonus increases
            increaseBtn.addEventListener('mousedown', (e) => {
                if (e.button === 0) startHold(name, increaseBtn, state, callbacks.onModify);
            });
            increaseBtn.addEventListener('mouseup', () => cancelHold(name));
            increaseBtn.addEventListener('mouseleave', () => cancelHold(name));

            increaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startHold(name, increaseBtn, state, callbacks.onModify);
            });
            increaseBtn.addEventListener('touchend', () => {
                const stat = state[name];
                if (stat && stat.current < stat.initial) {
                    // Normal tap below initial — fire increase directly
                    callbacks.onModify(name, 1);
                }
                // At/above initial: hold timer fires the increase; quick tap just cancels
                cancelHold(name);
            });
            increaseBtn.addEventListener('touchcancel', () => cancelHold(name));
        }
    });
}
