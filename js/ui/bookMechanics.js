/**
 * Book mechanics renderer module.
 * Phase 4 implementation; extended with freeform lists, named checklists,
 * tabasha panel, and textarea fields.
 *
 * Entry point: renderBookMechanics(container, bookConfig, mechanicsState, onMechanicsChange, onTabashaRestore)
 *
 * No circular imports: does NOT import app.js.
 * Follows D-17 module pattern: receives all state via function parameters.
 */

// ── Internal helpers ─────────────────────────────────────────────────────────

function getSubtitle(bookConfig) {
    if (bookConfig.bookNumber === 17) return 'F.E.A.R. Mechanics';
    if (bookConfig.bookNumber === 30) return 'Chasms of Malice';
    return 'Book Mechanics';
}

function hasMechanicsContent(bookConfig) {
    return (
        (bookConfig.extraStats && bookConfig.extraStats.length > 0) ||
        (bookConfig.resources && bookConfig.resources.length > 0) ||
        (bookConfig.checklists && bookConfig.checklists.length > 0) ||
        (bookConfig.namedChecklists && bookConfig.namedChecklists.length > 0) ||
        (bookConfig.freeformLists && bookConfig.freeformLists.length > 0) ||
        (bookConfig.tabasha != null) ||
        (bookConfig.textareas && bookConfig.textareas.length > 0) ||
        (bookConfig.superpower != null)
    );
}

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

function buildFreeformListHTML(listConfig, mechanicsState) {
    const key = `freeformList_${listConfig.id}`;
    const items = mechanicsState[key] || [];
    const itemsHTML = items.map((text, idx) => `
        <li class="freeform-list__item">
            <span class="freeform-list__item-text">${escapeHtml(text)}</span>
            <button class="freeform-list__delete"
                aria-label="Delete ${escapeHtml(text)}"
                data-freeform-list="${listConfig.id}"
                data-freeform-index="${idx}">×</button>
        </li>
    `).join('');

    return `
        <div class="freeform-list" data-freeform-id="${listConfig.id}">
            <p class="mechanics-title">${listConfig.label}</p>
            <ul class="freeform-list__items" id="bm-freeform-${listConfig.id}">${itemsHTML}</ul>
            <div class="freeform-list__add">
                <input type="text"
                    id="bm-freeform-input-${listConfig.id}"
                    placeholder="Add ${listConfig.label.replace(/s$/, '').toLowerCase()}..."
                    maxlength="120"
                    autocomplete="off">
                <button class="mechanic-btn"
                    data-freeform-add="${listConfig.id}">Add</button>
            </div>
        </div>
    `;
}

function buildTabashaHTML(tabConfig, mechanicsState) {
    const tabasha = mechanicsState.tabasha;
    if (!tabasha) return '';

    const attribute = tabasha.attribute
        ? tabasha.attribute.charAt(0).toUpperCase() + tabasha.attribute.slice(1)
        : '—';
    const restoreUsed = !!tabasha.restoreUsed;
    const encounters = tabasha.encounters || Array(tabConfig.encounterSlots).fill('');

    const encounterRowsHTML = encounters.map((val, idx) => `
        <div class="tabasha-panel__encounter-row">
            <span class="tabasha-panel__encounter-num">${idx + 2}</span>
            <input type="text"
                class="tabasha-panel__encounter-input"
                data-tabasha-encounter="${idx}"
                value="${escapeHtml(val)}"
                placeholder="Encounter ${idx + 2}"
                maxlength="80"
                autocomplete="off">
        </div>
    `).join('');

    return `
        <div class="tabasha-panel" style="margin-top:16px;">
            <p class="mechanics-title">Tabasha</p>
            <p class="tabasha-panel__attribute">${attribute}</p>
            <button class="mechanic-btn tabasha-panel__restore-btn"
                id="bm-tabasha-restore"
                ${restoreUsed ? 'disabled' : ''}>
                ${restoreUsed ? 'Tabasha Invoked' : 'Invoke Tabasha'}
            </button>
            <div class="tabasha-panel__encounters">
                ${encounterRowsHTML}
            </div>
        </div>
    `;
}

function buildTextareaHTML(textareaConfig, mechanicsState) {
    const key = `textarea_${textareaConfig.id}`;
    const value = mechanicsState[key] || '';
    return `
        <div class="mechanics-textarea">
            <p class="mechanics-title">${textareaConfig.label}</p>
            <textarea
                id="bm-textarea-${textareaConfig.id}"
                data-textarea-id="${textareaConfig.id}"
                rows="4"
                placeholder="Notes...">${escapeHtml(value)}</textarea>
        </div>
    `;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Main exported function ───────────────────────────────────────────────────

/**
 * Render book-specific mechanics into a container element.
 *
 * @param {HTMLElement} container
 * @param {Object} bookConfig
 * @param {Object} mechanicsState
 * @param {Function} onMechanicsChange - (updatedMechanicsState) => void
 * @param {Function} [onTabashaRestore] - (attribute: string) => void — called when Invoke Tabasha is clicked
 */
export function renderBookMechanics(container, bookConfig, mechanicsState, onMechanicsChange, onTabashaRestore) {
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

    // named checklists (same structure as checklists, different config key)
    if (bookConfig.namedChecklists && bookConfig.namedChecklists.length > 0) {
        for (const checklist of bookConfig.namedChecklists) {
            html += buildChecklistHTML(checklist, mechanicsState);
        }
    }

    // fixed checklists (legacy — kept for future use)
    if (bookConfig.checklists && bookConfig.checklists.length > 0) {
        for (const checklist of bookConfig.checklists) {
            html += buildChecklistHTML(checklist, mechanicsState);
        }
    }

    // tabasha panel
    if (bookConfig.tabasha) {
        html += buildTabashaHTML(bookConfig.tabasha, mechanicsState);
    }

    // freeform lists
    if (bookConfig.freeformLists && bookConfig.freeformLists.length > 0) {
        for (const listConfig of bookConfig.freeformLists) {
            html += buildFreeformListHTML(listConfig, mechanicsState);
        }
    }

    // textareas
    if (bookConfig.textareas && bookConfig.textareas.length > 0) {
        for (const textareaConfig of bookConfig.textareas) {
            html += buildTextareaHTML(textareaConfig, mechanicsState);
        }
    }

    // superpower display (read-only)
    if (bookConfig.superpower && mechanicsState.superpower) {
        html += `
            <div class="superpower-display" style="margin-top:16px;">
                <p class="mechanics-title">Superpower</p>
                <p class="superpower-display__value">${mechanicsState.superpower}</p>
            </div>
        `;
    }

    container.innerHTML = html;

    // ── Internal display updater (extraStats + resources only) ────────────────
    function updateDisplay() {
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

    // ── Freeform list re-render helper ────────────────────────────────────────
    function refreshFreeformList(listId) {
        const key = `freeformList_${listId}`;
        const items = mechanicsState[key] || [];
        const ul = container.querySelector(`#bm-freeform-${listId}`);
        if (!ul) return;
        ul.innerHTML = items.map((text, idx) => `
            <li class="freeform-list__item">
                <span class="freeform-list__item-text">${escapeHtml(text)}</span>
                <button class="freeform-list__delete"
                    aria-label="Delete ${escapeHtml(text)}"
                    data-freeform-list="${listId}"
                    data-freeform-index="${idx}">×</button>
            </li>
        `).join('');
    }

    // ── Event binding ─────────────────────────────────────────────────────────

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

    // checklist checkboxes — event delegation (handles both checklists and namedChecklists)
    const hasAnyChecklist = (bookConfig.checklists && bookConfig.checklists.length > 0)
        || (bookConfig.namedChecklists && bookConfig.namedChecklists.length > 0);
    if (hasAnyChecklist) {
        container.addEventListener('change', (e) => {
            const checkbox = e.target;
            if (checkbox.type !== 'checkbox') return;
            const checklistId = checkbox.dataset.checklist;
            const itemId = checkbox.dataset.item;
            if (!checklistId || !itemId) return;
            const key = `checklist_${checklistId}_${itemId}`;
            mechanicsState[key] = checkbox.checked;
            const li = checkbox.closest('.checklist-item');
            if (li) li.classList.toggle('checked', checkbox.checked);
            onMechanicsChange(mechanicsState);
        });
    }

    // tabasha: restore button + encounter inputs
    if (bookConfig.tabasha) {
        const restoreBtn = container.querySelector('#bm-tabasha-restore');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                if (!mechanicsState.tabasha) return;
                mechanicsState.tabasha.restoreUsed = true;
                restoreBtn.disabled = true;
                restoreBtn.textContent = 'Tabasha Invoked';
                onMechanicsChange(mechanicsState);
                if (onTabashaRestore) {
                    onTabashaRestore(mechanicsState.tabasha.attribute);
                }
            });
        }

        // Encounter input delegation
        container.addEventListener('input', (e) => {
            const input = e.target;
            const idx = input.dataset.tabashaEncounter;
            if (idx === undefined) return;
            if (!mechanicsState.tabasha) return;
            if (!mechanicsState.tabasha.encounters) {
                mechanicsState.tabasha.encounters = Array(bookConfig.tabasha.encounterSlots).fill('');
            }
            mechanicsState.tabasha.encounters[parseInt(idx, 10)] = input.value;
            onMechanicsChange(mechanicsState);
        });
    }

    // freeform list: add button + delete delegation
    if (bookConfig.freeformLists && bookConfig.freeformLists.length > 0) {
        // Add button clicks
        container.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-freeform-add]');
            if (addBtn) {
                const listId = addBtn.dataset.freeformAdd;
                const input = container.querySelector(`#bm-freeform-input-${listId}`);
                if (!input) return;
                const text = input.value.trim();
                if (!text) return;
                const key = `freeformList_${listId}`;
                if (!mechanicsState[key]) mechanicsState[key] = [];
                mechanicsState[key].push(text);
                input.value = '';
                refreshFreeformList(listId);
                onMechanicsChange(mechanicsState);
                return;
            }

            const delBtn = e.target.closest('[data-freeform-list]');
            if (delBtn && delBtn.dataset.freeformIndex !== undefined) {
                const listId = delBtn.dataset.freeformList;
                const idx = parseInt(delBtn.dataset.freeformIndex, 10);
                const key = `freeformList_${listId}`;
                if (mechanicsState[key]) {
                    mechanicsState[key].splice(idx, 1);
                    refreshFreeformList(listId);
                    onMechanicsChange(mechanicsState);
                }
            }
        });

        // Allow Enter key in freeform inputs to add
        container.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const input = e.target;
            const match = input.id && input.id.match(/^bm-freeform-input-(.+)$/);
            if (!match) return;
            const listId = match[1];
            const text = input.value.trim();
            if (!text) return;
            const key = `freeformList_${listId}`;
            if (!mechanicsState[key]) mechanicsState[key] = [];
            mechanicsState[key].push(text);
            input.value = '';
            refreshFreeformList(listId);
            onMechanicsChange(mechanicsState);
        });
    }

    // textarea inputs
    if (bookConfig.textareas && bookConfig.textareas.length > 0) {
        container.addEventListener('input', (e) => {
            const textarea = e.target;
            const textareaId = textarea.dataset.textareaId;
            if (!textareaId) return;
            const key = `textarea_${textareaId}`;
            mechanicsState[key] = textarea.value;
            onMechanicsChange(mechanicsState);
        });
    }
}
