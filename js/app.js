/**
 * Main application logic for Fighting Fantasy Adventure Sheet
 */

import { rollInitialStats } from './dice.js';
import { save, load } from './storage.js';
import { BOOKS, getBook, searchBooks } from './books.js';

// All games state (keyed by book number)
let games = {};

// Current book number
let currentBook = null;

// Current game state
let state = {
    skill: { initial: 0, current: 0 },
    stamina: { initial: 0, current: 0 },
    luck: { initial: 0, current: 0 }
};

// Long-press tracking for bonus increases
const HOLD_DURATION = 500;
let holdTimers = {};

// Modal state
let isSelectingForNewGame = false;

/**
 * Initialize the application
 */
async function init() {
    const data = await load();
    if (data && data.games) {
        games = data.games;
        currentBook = data.currentBook;
        if (currentBook && games[currentBook]) {
            state = games[currentBook];
        }
    }

    render();
    bindEvents();

    // If no current book, show selection
    if (!currentBook) {
        showBookModal(false);
    }
}

/**
 * Show the book selection modal
 * @param {boolean} forNewGame - Whether selecting for a new game
 */
function showBookModal(forNewGame) {
    isSelectingForNewGame = forNewGame;
    const modal = document.getElementById('book-modal');
    const search = document.getElementById('book-search');
    const cancelBtn = document.getElementById('modal-cancel');

    modal.classList.add('active');
    search.value = '';
    renderBookList('');
    search.focus();

    // Hide cancel if no current book
    cancelBtn.style.display = currentBook ? 'block' : 'none';
}

/**
 * Hide the book selection modal
 */
function hideBookModal() {
    const modal = document.getElementById('book-modal');
    modal.classList.remove('active');
}

/**
 * Render the book list based on search query
 * @param {string} query - Search query
 */
function renderBookList(query) {
    const list = document.getElementById('book-list');
    const results = searchBooks(query);

    list.innerHTML = results.map(book => {
        const hasGame = games[book.number] !== undefined;
        return `
            <li class="book-item ${hasGame ? 'has-game' : ''}" data-number="${book.number}">
                <span class="book-number">${book.number}.</span>
                <span class="book-name">${book.title}</span>
                ${hasGame ? '<span class="book-status">In Progress</span>' : ''}
            </li>
        `;
    }).join('');
}

/**
 * Select a book
 * @param {number} bookNumber - The book number to select
 */
async function selectBook(bookNumber) {
    const book = getBook(bookNumber);
    if (!book) return;

    const hasExistingGame = games[bookNumber] !== undefined;

    if (isSelectingForNewGame) {
        // Starting a new game for this book
        if (hasExistingGame) {
            const confirmed = window.confirm(
                `You have a game in progress for "${book.title}".\n\n` +
                `Current stats: Skill ${games[bookNumber].skill.current}/${games[bookNumber].skill.initial}, ` +
                `Stamina ${games[bookNumber].stamina.current}/${games[bookNumber].stamina.initial}, ` +
                `Luck ${games[bookNumber].luck.current}/${games[bookNumber].luck.initial}\n\n` +
                `Start a new adventure? Your current progress will be lost.`
            );
            if (!confirmed) return;
        }

        // Create new game for this book
        const stats = rollInitialStats();
        state = {
            skill: { initial: stats.skill, current: stats.skill },
            stamina: { initial: stats.stamina, current: stats.stamina },
            luck: { initial: stats.luck, current: stats.luck }
        };
        games[bookNumber] = state;
        currentBook = bookNumber;
        await save({ games, currentBook });
    } else {
        // Just switching to view/continue a book
        if (hasExistingGame) {
            state = games[bookNumber];
            currentBook = bookNumber;
            await save({ games, currentBook });
        } else {
            // No game exists, start a new one
            const stats = rollInitialStats();
            state = {
                skill: { initial: stats.skill, current: stats.skill },
                stamina: { initial: stats.stamina, current: stats.stamina },
                luck: { initial: stats.luck, current: stats.luck }
            };
            games[bookNumber] = state;
            currentBook = bookNumber;
            await save({ games, currentBook });
        }
    }

    hideBookModal();
    render();
}

/**
 * Modify a stat by the given delta
 * @param {string} name - The stat name (skill, stamina, luck)
 * @param {number} delta - The change amount (+1 or -1)
 * @param {boolean} allowBonus - Whether to allow increasing above initial
 */
async function modifyStat(name, delta, allowBonus = false) {
    const stat = state[name];
    if (!stat) return;

    const newValue = stat.current + delta;

    if (newValue < 0) return;

    if (delta > 0 && stat.current >= stat.initial && !allowBonus) {
        return;
    }

    stat.current = newValue;
    games[currentBook] = state;
    await save({ games, currentBook });
    renderStat(name);
}

/**
 * Render all stats and book title to the DOM
 */
function render() {
    renderBookTitle();
    renderStat('skill');
    renderStat('stamina');
    renderStat('luck');
}

/**
 * Render the current book title
 */
function renderBookTitle() {
    const titleEl = document.getElementById('book-title');
    if (!titleEl) return;

    if (currentBook) {
        const book = getBook(currentBook);
        titleEl.textContent = book ? `#${book.number}: ${book.title}` : 'Fighting Fantasy';
    } else {
        titleEl.textContent = 'Select a Book';
    }
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
 * Start hold timer for bonus increase
 * @param {string} name - The stat name
 * @param {HTMLElement} btn - The button element
 */
function startHold(name, btn) {
    cancelHold(name);

    const stat = state[name];
    if (!stat || stat.current < stat.initial) {
        return;
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
 * Bind event listeners
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
            increaseBtn.addEventListener('click', () => {
                const stat = state[name];
                if (stat && stat.current < stat.initial) {
                    modifyStat(name, 1);
                }
            });

            // Long-press for bonus increases
            increaseBtn.addEventListener('mousedown', (e) => {
                if (e.button === 0) startHold(name, increaseBtn);
            });
            increaseBtn.addEventListener('mouseup', () => cancelHold(name));
            increaseBtn.addEventListener('mouseleave', () => cancelHold(name));

            increaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startHold(name, increaseBtn);
            });
            increaseBtn.addEventListener('touchend', () => {
                const stat = state[name];
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
        newGameBtn.addEventListener('click', () => showBookModal(true));
    }

    // Switch Book button
    const switchBtn = document.getElementById('switch-book');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => showBookModal(false));
    }

    // Book title click
    const bookTitle = document.getElementById('book-title');
    if (bookTitle) {
        bookTitle.addEventListener('click', () => showBookModal(false));
    }

    // Book search
    const bookSearch = document.getElementById('book-search');
    if (bookSearch) {
        bookSearch.addEventListener('input', (e) => renderBookList(e.target.value));
    }

    // Book list clicks
    const bookList = document.getElementById('book-list');
    if (bookList) {
        bookList.addEventListener('click', (e) => {
            const item = e.target.closest('.book-item');
            if (item) {
                const num = parseInt(item.dataset.number, 10);
                selectBook(num);
            }
        });
    }

    // Modal cancel
    const cancelBtn = document.getElementById('modal-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideBookModal);
    }

    // Close modal on overlay click
    const modal = document.getElementById('book-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && currentBook) {
                hideBookModal();
            }
        });
    }

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentBook) {
            hideBookModal();
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
