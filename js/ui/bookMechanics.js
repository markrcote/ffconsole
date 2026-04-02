/**
 * Book mechanics renderer module.
 * Phase 4 implementation.
 *
 * Entry point: renderBookMechanics(container, bookConfig, mechanicsState, onMechanicsChange)
 *
 * No circular imports: does NOT import app.js.
 * Follows D-17 module pattern: receives all state via function parameters.
 */

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Get subtitle text for a book.
 * @param {Object} bookConfig
 * @returns {string}
 */
function getSubtitle(bookConfig) {
    if (bookConfig.bookNumber === 17) return 'F.E.A.R. Mechanics';
    if (bookConfig.bookNumber === 30) return 'Chasms of Malice';
    return 'Book Mechanics';
}

/**
 * Check if a book config has any mechanic content.
 * @param {Object} bookConfig
 * @returns {boolean}
 */
function hasMechanicsContent(bookConfig) {
    return (
        (bookConfig.extraStats && bookConfig.extraStats.length > 0) ||
        (bookConfig.resources && bookConfig.resources.length > 0) ||
        (bookConfig.checklists && bookConfig.checklists.length > 0) ||
        (bookConfig.superpower != null)
    );
}

/**
 * Build HTML for a stat/resource row.
 * @param {string} prefix - 'bm-stat' or 'bm-resource'
 * @param {Object} item - stat or resource config
 * @param {number} currentVal - current value
 * @returns {string}
 */
function buildStatRowHTML(prefix, item, currentVal) {
    const atMin = currentVal <= item.min;
    const atMax = item.max !== null && currentVal >= item.max;
    return `
        <div class="stat-row">
            <span class="stat-label">${item.label}</span>
            <div class="stat-controls">
                <button class="stat-btn"
                    id="${prefix}-${item.id}-decrease"
                    aria-label="Decrease ${item.label}"
                    ${atMin ? 'disabled' : ''}
                    style="${atMin ? 'opacity:0.3;cursor:not-allowed;' : ''}">−</button>
                <div class="stat-values">
                    <span class="stat-current" id="${prefix}-${item.id}-current">${currentVal}</span>
                </div>
                <button class="stat-btn"
                    id="${prefix}-${item.id}-increase"
                    aria-label="Increase ${item.label}"
                    ${atMax ? 'disabled' : ''}
                    style="${atMax ? 'opacity:0.3;cursor:not-allowed;' : ''}">+</button>
            </div>
        </div>
    `;
}

/**
 * Build HTML for a checklist group.
 * @param {Object} checklist - checklist config { id, label, items }
 * @param {Object} mechanicsState - current mechanics state
 * @returns {string}
 */
function buildChecklistHTML(checklist, mechanicsState) {
    const itemsHTML = checklist.items.map(item => {
        const key = `checklist_${checklist.id}_${item.id}`;
        const checked = !!mechanicsState[key];
        return `
            <li class="checklist-item${checked ? ' checked' : ''}">
                <input type="checkbox"
                    id="bm-check-${checklist.id}-${item.id}"
                    data-checklist="${checklist.id}"
                    data-item="${item.id}"
                    ${checked ? 'checked' : ''}>
                <label for="bm-check-${checklist.id}-${item.id}">${item.label}</label>
            </li>
        `;
    }).join('');

    return `
        <div class="checklist-group" style="margin-top:16px;">
            <p class="mechanics-title checklist-group__label">${checklist.label}</p>
            <ul class="checklist-items">${itemsHTML}</ul>
        </div>
    `;
}

// ── Main exported function ───────────────────────────────────────────────────

/**
 * Render book-specific mechanics into a container element.
 * Called on initial render and when book changes.
 * Full DOM rebuild on each call; event listeners re-attached each time.
 *
 * @param {HTMLElement} container - The #book-mechanics-section DOM element
 * @param {Object} bookConfig - Config from getBookConfig() (extraStats, resources, checklists, superpower)
 * @param {Object} mechanicsState - Current persisted mechanics values dict
 * @param {Function} onMechanicsChange - Callback: (updatedMechanicsState) => void
 */
export function renderBookMechanics(container, bookConfig, mechanicsState, onMechanicsChange) {
    // Guard: hide section when no mechanics content
    if (!bookConfig || !hasMechanicsContent(bookConfig)) {
        container.hidden = true;
        return;
    }
    container.removeAttribute('hidden');

    // ── Build full HTML ────────────────────────────────────────────────────────
    let html = `<h3 class="mechanics-title book-mechanics-subtitle">${getSubtitle(bookConfig)}</h3>`;

    // extraStats rows
    if (bookConfig.extraStats && bookConfig.extraStats.length > 0) {
        for (const stat of bookConfig.extraStats) {
            const currentVal = mechanicsState[`stat_${stat.id}`] ?? stat.initial;
            html += buildStatRowHTML('bm-stat', stat, currentVal);
        }
    }

    // resources rows
    if (bookConfig.resources && bookConfig.resources.length > 0) {
        for (const resource of bookConfig.resources) {
            const currentVal = mechanicsState[`resource_${resource.id}`] ?? resource.initial;
            html += buildStatRowHTML('bm-resource', resource, currentVal);
        }
    }

    // checklists
    if (bookConfig.checklists && bookConfig.checklists.length > 0) {
        for (const checklist of bookConfig.checklists) {
            html += buildChecklistHTML(checklist, mechanicsState);
        }
    }

    // superpower display (read-only) — only when mechanicsState.superpower is set
    if (bookConfig.superpower && mechanicsState.superpower) {
        html += `
            <div class="superpower-display" style="margin-top:16px;">
                <p class="mechanics-title">Superpower</p>
                <p class="superpower-display__value">${mechanicsState.superpower}</p>
            </div>
        `;
    }

    container.innerHTML = html;

    // ── Internal display updater ───────────────────────────────────────────────
    // Updates just the values and disabled states without full DOM rebuild.

    function updateDisplay() {
        // Update extraStats
        if (bookConfig.extraStats) {
            for (const stat of bookConfig.extraStats) {
                const key = `stat_${stat.id}`;
                const val = mechanicsState[key] ?? stat.initial;
                const currentEl = container.querySelector(`#bm-stat-${stat.id}-current`);
                const decBtn = container.querySelector(`#bm-stat-${stat.id}-decrease`);
                const incBtn = container.querySelector(`#bm-stat-${stat.id}-increase`);

                if (currentEl) currentEl.textContent = val;
                if (decBtn) {
                    const atMin = val <= stat.min;
                    decBtn.disabled = atMin;
                    decBtn.style.opacity = atMin ? '0.3' : '';
                    decBtn.style.cursor = atMin ? 'not-allowed' : '';
                }
                if (incBtn) {
                    const atMax = stat.max !== null && val >= stat.max;
                    incBtn.disabled = atMax;
                    incBtn.style.opacity = atMax ? '0.3' : '';
                    incBtn.style.cursor = atMax ? 'not-allowed' : '';
                }
            }
        }

        // Update resources
        if (bookConfig.resources) {
            for (const resource of bookConfig.resources) {
                const key = `resource_${resource.id}`;
                const val = mechanicsState[key] ?? resource.initial;
                const currentEl = container.querySelector(`#bm-resource-${resource.id}-current`);
                const decBtn = container.querySelector(`#bm-resource-${resource.id}-decrease`);
                const incBtn = container.querySelector(`#bm-resource-${resource.id}-increase`);

                if (currentEl) currentEl.textContent = val;
                if (decBtn) {
                    const atMin = val <= resource.min;
                    decBtn.disabled = atMin;
                    decBtn.style.opacity = atMin ? '0.3' : '';
                    decBtn.style.cursor = atMin ? 'not-allowed' : '';
                }
                if (incBtn) {
                    const atMax = resource.max !== null && val >= resource.max;
                    incBtn.disabled = atMax;
                    incBtn.style.opacity = atMax ? '0.3' : '';
                    incBtn.style.cursor = atMax ? 'not-allowed' : '';
                }
            }
        }
    }

    // ── Event binding ──────────────────────────────────────────────────────────

    // extraStats +/- buttons
    if (bookConfig.extraStats) {
        for (const stat of bookConfig.extraStats) {
            const decBtn = container.querySelector(`#bm-stat-${stat.id}-decrease`);
            const incBtn = container.querySelector(`#bm-stat-${stat.id}-increase`);

            if (decBtn) {
                decBtn.addEventListener('click', () => {
                    const key = `stat_${stat.id}`;
                    const current = mechanicsState[key] ?? stat.initial;
                    const next = Math.max(stat.min, current - 1);
                    if (next !== current) {
                        mechanicsState[key] = next;
                        updateDisplay();
                        onMechanicsChange(mechanicsState);
                    }
                });
            }

            if (incBtn) {
                incBtn.addEventListener('click', () => {
                    const key = `stat_${stat.id}`;
                    const current = mechanicsState[key] ?? stat.initial;
                    const next = stat.max !== null ? Math.min(stat.max, current + 1) : current + 1;
                    if (next !== current) {
                        mechanicsState[key] = next;
                        updateDisplay();
                        onMechanicsChange(mechanicsState);
                    }
                });
            }
        }
    }

    // resources +/- buttons
    if (bookConfig.resources) {
        for (const resource of bookConfig.resources) {
            const decBtn = container.querySelector(`#bm-resource-${resource.id}-decrease`);
            const incBtn = container.querySelector(`#bm-resource-${resource.id}-increase`);

            if (decBtn) {
                decBtn.addEventListener('click', () => {
                    const key = `resource_${resource.id}`;
                    const current = mechanicsState[key] ?? resource.initial;
                    const next = Math.max(resource.min, current - 1);
                    if (next !== current) {
                        mechanicsState[key] = next;
                        updateDisplay();
                        onMechanicsChange(mechanicsState);
                    }
                });
            }

            if (incBtn) {
                incBtn.addEventListener('click', () => {
                    const key = `resource_${resource.id}`;
                    const current = mechanicsState[key] ?? resource.initial;
                    const next = resource.max !== null ? Math.min(resource.max, current + 1) : current + 1;
                    if (next !== current) {
                        mechanicsState[key] = next;
                        updateDisplay();
                        onMechanicsChange(mechanicsState);
                    }
                });
            }
        }
    }

    // checklist checkboxes — event delegation on container
    if (bookConfig.checklists && bookConfig.checklists.length > 0) {
        container.addEventListener('change', (e) => {
            const checkbox = e.target;
            if (checkbox.type !== 'checkbox') return;

            const checklistId = checkbox.dataset.checklist;
            const itemId = checkbox.dataset.item;
            if (!checklistId || !itemId) return;

            const key = `checklist_${checklistId}_${itemId}`;
            mechanicsState[key] = checkbox.checked;

            // Toggle .checked class on the parent <li>
            const li = checkbox.closest('.checklist-item');
            if (li) li.classList.toggle('checked', checkbox.checked);

            onMechanicsChange(mechanicsState);
        });
    }
}
