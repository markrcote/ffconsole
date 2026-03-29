/**
 * Character creation flow UI.
 * Phase 2 implementation.
 *
 * Entry point: showCharCreate({ games, currentBook, save, onComplete })
 *   - games: current games state object (keyed by book number)
 *   - currentBook: currently active book number or null
 *   - save: async function({ games, currentBook }) — persists state
 *   - onComplete: async function(bookNumber, stats, name) — called on confirm
 *
 * No circular imports: does NOT import app.js.
 */

import { roll } from '../dice.js';
import { searchBooks, getBook } from '../books.js';
import { CONFIG_REGISTRY } from '../config/mechanics/registry.js';

// ── Die animation ────────────────────────────────────────────────────────────

/**
 * Animate a die face element: cycle random values for 600ms, snap to final.
 * @param {HTMLElement} el - The .die-face element
 * @param {number} finalValue - Value to settle on
 * @param {Function} [onDone] - Called when animation completes
 */
function animateDieFace(el, finalValue, onDone) {
    el.setAttribute('aria-label', 'Rolling dice...');
    el.classList.add('rolling');
    const duration = 600;
    const interval = 60;
    let elapsed = 0;
    const timer = setInterval(() => {
        el.textContent = Math.floor(Math.random() * 6) + 1;
        elapsed += interval;
        if (elapsed >= duration) {
            clearInterval(timer);
            el.textContent = finalValue;
            el.classList.remove('rolling');
            el.removeAttribute('aria-label');
            if (onDone) onDone();
        }
    }, interval);
}

// ── Book search rendering ────────────────────────────────────────────────────

/**
 * Render book list items into the provided <ul> element.
 * Reuses the same .book-item / .book-number / .book-name / .book-status
 * pattern as app.js renderBookList() — no class duplication.
 * @param {HTMLUListElement} listEl
 * @param {string} query
 * @param {Object} games - current games state
 * @param {number|null} selectedBook - currently highlighted book number
 */
function renderModalBookList(listEl, query, games, selectedBook) {
    const results = searchBooks(query);
    listEl.innerHTML = results.map(book => {
        const hasGame = games[book.number] !== undefined;
        const isSelected = selectedBook === book.number;
        return `
            <li class="book-item ${hasGame ? 'has-game' : ''} ${isSelected ? 'selected' : ''}"
                data-number="${book.number}">
                <span class="book-number">${book.number}.</span>
                <span class="book-name">${book.title}</span>
                ${hasGame ? '<span class="book-status">In Progress</span>' : ''}
            </li>
        `;
    }).join('');
}

// ── Book config note (CHAR-05) ───────────────────────────────────────────────

/**
 * Returns an inline note if the selected book has a mechanics config.
 * CONFIG_REGISTRY has all entries commented out until Phase 4, so this
 * never fires in Phase 2 — the check and display path exists for CHAR-05.
 */
function getBookConfigNote(bookNumber) {
    if (!bookNumber) return '';
    const hasConfig = CONFIG_REGISTRY && CONFIG_REGISTRY[bookNumber];
    if (!hasConfig) return '';
    const book = getBook(bookNumber);
    const title = book ? book.title : `Book ${bookNumber}`;
    return `<p class="char-create-book-note">Extra mechanics for ${title} will be added to your sheet.</p>`;
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * Show the character creation modal.
 * @param {Object} opts
 * @param {Object} opts.games - All sessions keyed by book number
 * @param {number|null} opts.currentBook - Currently active book, or null
 * @param {Function} opts.save - async (stateBlob) => void
 * @param {Function} opts.onComplete - async (bookNumber, stats, name) => void
 */
export function showCharCreate({ games, currentBook, save, onComplete }) {
    // ── State local to this modal instance ──────────────────────────────────
    let selectedBook = null;
    let rolledStats = null; // { skill, stamina, luck, dice: { skill:[d], stamina:[d,d], luck:[d] } }

    // ── Build modal DOM ──────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'char-create-overlay';

    overlay.innerHTML = `
        <div class="modal" id="char-create-modal" role="dialog" aria-modal="true" aria-labelledby="char-create-title">
            <h2 class="modal-title" id="char-create-title">New Adventure</h2>

            <!-- Step 1: Book selection -->
            <p class="char-create-section-label">Choose Your Adventure</p>
            <input type="text" class="book-search" id="cc-book-search"
                   placeholder="Search books..." autocomplete="off">
            <ul class="book-list" id="cc-book-list"></ul>
            <div id="cc-book-note"></div>

            <!-- Step 2: Dice roll area -->
            <p class="char-create-section-label" style="margin-top:16px;">Your Stats</p>
            <div id="cc-dice-area">
                <!-- Skill row: 1d6 + 6 -->
                <div class="char-create-dice-row" id="cc-row-skill">
                    <span class="char-create-dice-label">Skill</span>
                    <span class="die-face" id="cc-die-skill">–</span>
                    <span class="char-create-dice-bonus">+ 6</span>
                    <span class="char-create-dice-total" id="cc-total-skill">–</span>
                </div>
                <!-- Stamina row: 2d6 + 12 -->
                <div class="char-create-dice-row" id="cc-row-stamina">
                    <span class="char-create-dice-label">Stamina</span>
                    <span class="die-face" id="cc-die-stamina-1">–</span>
                    <span class="die-face" id="cc-die-stamina-2">–</span>
                    <span class="char-create-dice-bonus">+ 12</span>
                    <span class="char-create-dice-total" id="cc-total-stamina">–</span>
                </div>
                <!-- Luck row: 1d6 + 6 -->
                <div class="char-create-dice-row" id="cc-row-luck">
                    <span class="char-create-dice-label">Luck</span>
                    <span class="die-face" id="cc-die-luck">–</span>
                    <span class="char-create-dice-bonus">+ 6</span>
                    <span class="char-create-dice-total" id="cc-total-luck">–</span>
                </div>
            </div>

            <!-- Roll button (disabled after first roll per D-05) -->
            <button class="mechanic-btn mechanic-btn--primary" id="cc-roll-btn"
                    style="width:100%;margin-top:12px;">Roll!</button>

            <!-- Step 3: Name input -->
            <p class="char-create-section-label" style="margin-top:16px;">Character Name</p>
            <input type="text" class="book-search" id="cc-name-input"
                   placeholder="Adventurer" maxlength="80" autocomplete="off">

            <!-- Overwrite warning (hidden until needed) -->
            <p class="char-create-warning" id="cc-warning" style="display:none;"></p>

            <!-- Error message -->
            <p class="char-create-error" id="cc-error" aria-live="polite"></p>

            <!-- Confirm -->
            <button class="mechanic-btn mechanic-btn--primary" id="cc-confirm-btn"
                    style="width:100%;margin-top:12px;" disabled>Begin Adventure</button>

            <!-- Cancel (only shown when a session exists) -->
            ${currentBook
                ? `<button class="modal-cancel" id="cc-cancel-btn" style="margin-top:10px;">Keep current character</button>`
                : ''}
        </div>
    `;

    document.body.appendChild(overlay);

    // ── Element refs ─────────────────────────────────────────────────────────
    const bookSearch   = overlay.querySelector('#cc-book-search');
    const bookList     = overlay.querySelector('#cc-book-list');
    const bookNote     = overlay.querySelector('#cc-book-note');
    const rollBtn      = overlay.querySelector('#cc-roll-btn');
    const confirmBtn   = overlay.querySelector('#cc-confirm-btn');
    const cancelBtn    = overlay.querySelector('#cc-cancel-btn');
    const errorEl      = overlay.querySelector('#cc-error');
    const warningEl    = overlay.querySelector('#cc-warning');

    // Die face elements
    const dieSkill     = overlay.querySelector('#cc-die-skill');
    const dieStamina1  = overlay.querySelector('#cc-die-stamina-1');
    const dieStamina2  = overlay.querySelector('#cc-die-stamina-2');
    const dieLuck      = overlay.querySelector('#cc-die-luck');

    // Total display elements
    const totalSkill   = overlay.querySelector('#cc-total-skill');
    const totalStamina = overlay.querySelector('#cc-total-stamina');
    const totalLuck    = overlay.querySelector('#cc-total-luck');

    // ── Cleanup ───────────────────────────────────────────────────────────────
    function cleanup() {
        overlay.remove();
    }

    // ── Book list rendering ───────────────────────────────────────────────────
    renderModalBookList(bookList, '', games, selectedBook);

    bookSearch.addEventListener('input', (e) => {
        renderModalBookList(bookList, e.target.value, games, selectedBook);
    });

    bookList.addEventListener('click', (e) => {
        const item = e.target.closest('.book-item');
        if (!item) return;
        const num = parseInt(item.dataset.number, 10);
        selectedBook = num;
        errorEl.textContent = '';
        // Re-render list to show selected state
        renderModalBookList(bookList, bookSearch.value, games, selectedBook);
        // Show book config note if applicable (CHAR-05)
        bookNote.innerHTML = getBookConfigNote(selectedBook);
        // Show overwrite warning if this book has an existing game
        const existingGame = games[selectedBook];
        if (existingGame) {
            warningEl.textContent = 'This will replace your current adventure. Are you sure?';
            warningEl.style.display = 'block';
            if (rolledStats) {
                confirmBtn.textContent = 'Yes, start over';
            }
        } else {
            warningEl.style.display = 'none';
            if (rolledStats) {
                confirmBtn.textContent = 'Begin Adventure';
            }
        }
    });

    // ── Roll step ──────────────────────────────────────────────────────────
    rollBtn.addEventListener('click', () => {
        // Roll dice individually for display (CHAR-01, D-06)
        // rollInitialStats() is NOT used here — we need individual die values.
        const skillDie    = roll(6);
        const staminaDie1 = roll(6);
        const staminaDie2 = roll(6);
        const luckDie     = roll(6);

        const skillTotal   = skillDie + 6;
        const staminaTotal = staminaDie1 + staminaDie2 + 12;
        const luckTotal    = luckDie + 6;

        rolledStats = {
            skill:   { initial: skillTotal,   current: skillTotal },
            stamina: { initial: staminaTotal,  current: staminaTotal },
            luck:    { initial: luckTotal,     current: luckTotal },
        };

        // Animate all dice; enable confirm once all animations complete (D-04, D-05)
        rollBtn.disabled = true;
        rollBtn.style.opacity = '0.4';

        let doneCount = 0;
        const total = 4; // four die face elements
        function onDieAnimationDone() {
            doneCount++;
            if (doneCount === total) {
                // All animations complete — show totals and enable confirm
                totalSkill.textContent   = `= ${skillTotal}`;
                totalStamina.textContent = `= ${staminaTotal}`;
                totalLuck.textContent    = `= ${luckTotal}`;
                confirmBtn.disabled = false;
                // Adjust confirm button label if overwrite is pending
                if (selectedBook && games[selectedBook]) {
                    confirmBtn.textContent = 'Yes, start over';
                } else {
                    confirmBtn.textContent = 'Begin Adventure';
                }
            }
        }

        animateDieFace(dieSkill,    skillDie,    onDieAnimationDone);
        animateDieFace(dieStamina1, staminaDie1, onDieAnimationDone);
        animateDieFace(dieStamina2, staminaDie2, onDieAnimationDone);
        animateDieFace(dieLuck,     luckDie,     onDieAnimationDone);
    });

    // ── Confirm step ───────────────────────────────────────────────────────
    confirmBtn.addEventListener('click', async () => {
        errorEl.textContent = '';

        // Validate: book must be selected
        if (!selectedBook) {
            errorEl.textContent = 'Choose a book to continue';
            return;
        }

        // Validate: dice must have been rolled (button should already be disabled — belt and suspenders)
        if (!rolledStats) {
            errorEl.textContent = 'Roll your stats first';
            return;
        }

        // Resolve character name: blank input defaults to null (display layer handles default per D-14)
        const nameInput = overlay.querySelector('#cc-name-input');
        const name = (nameInput.value.trim()) || null; // null stored as null; display layer hides empty

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Starting...';

        try {
            await onComplete(selectedBook, rolledStats, name);
        } finally {
            cleanup();
        }
    });

    // ── Cancel ─────────────────────────────────────────────────────────────
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            cleanup();
        });
    }

    // Close on overlay background click (only if a current session exists to return to)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay && currentBook) {
            cleanup();
        }
    });

    // Close on Escape (only if returnable session)
    function onKeydown(e) {
        if (e.key === 'Escape' && currentBook) {
            cleanup();
            document.removeEventListener('keydown', onKeydown);
        }
    }
    document.addEventListener('keydown', onKeydown);

    // Focus the book search on open
    bookSearch.focus();
}
