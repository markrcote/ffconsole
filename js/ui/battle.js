/**
 * Battle system panel UI.
 * Self-contained module — receives container, state accessor, and callbacks.
 * Does NOT import app.js (circular import pitfall).
 */

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Update both stamina bars with current/max values and critical class.
 */
function updateStaminaBars(container, playerCurrent, playerMax, enemyCurrent, enemyMax) {
    const playerPct = playerMax > 0
        ? Math.max(0, Math.round((playerCurrent / playerMax) * 100))
        : 0;
    const enemyPct = enemyMax > 0
        ? Math.max(0, Math.round((enemyCurrent / enemyMax) * 100))
        : 0;

    const playerFill = container.querySelector('#player-stamina-fill');
    const playerBar  = container.querySelector('#player-stamina-bar');
    const playerVal  = container.querySelector('#player-stamina-value');
    const enemyFill  = container.querySelector('#enemy-stamina-fill');
    const enemyBar   = container.querySelector('#enemy-stamina-bar');
    const enemyVal   = container.querySelector('#enemy-stamina-value');

    if (playerFill) {
        playerFill.style.width = `${playerPct}%`;
        if (playerPct <= 25) {
            playerFill.classList.add('stamina-bar__fill--critical');
        } else {
            playerFill.classList.remove('stamina-bar__fill--critical');
        }
    }
    if (playerBar) {
        playerBar.setAttribute('aria-valuenow', playerCurrent);
        playerBar.setAttribute('aria-valuemax', playerMax);
    }
    if (playerVal) playerVal.textContent = `${playerCurrent}/${playerMax}`;

    if (enemyFill) {
        enemyFill.style.width = `${enemyPct}%`;
        if (enemyPct <= 25) {
            enemyFill.classList.add('stamina-bar__fill--critical');
        } else {
            enemyFill.classList.remove('stamina-bar__fill--critical');
        }
    }
    if (enemyBar) {
        enemyBar.setAttribute('aria-valuenow', enemyCurrent);
        enemyBar.setAttribute('aria-valuemax', enemyMax);
    }
    if (enemyVal) enemyVal.textContent = `${enemyCurrent}/${enemyMax}`;
}

/**
 * Split a 2d6 total into two cosmetic individual die values.
 * The split is cosmetic — the total is what matters mechanically.
 */
function splitRoll(total) {
    const d1 = Math.ceil(total / 2);
    const d2 = total - d1;
    return { d1, d2 };
}

/**
 * Render a round result card as an HTML string.
 * @param {number} round
 * @param {Object} result - from rollCombatRound callback
 * @param {Object} enemy - { name, skill, stamina, staminaInitial }
 * @param {number} playerStamina - authoritative player stamina after round
 * @param {number} playerSkill - current player skill
 */
function renderRoundCard(round, result, enemy, playerStamina, playerSkill, luckResult = null) {
    const { d1: pd1, d2: pd2 } = splitRoll(result.playerRoll);
    const { d1: ed1, d2: ed2 } = splitRoll(result.enemyRoll);

    let outcomeText;
    if (result.result === 'player_hit') {
        outcomeText = `You hit! ${enemy.name} takes 2 damage`;
    } else if (result.result === 'enemy_hit') {
        outcomeText = `${enemy.name} hits! You take 2 damage`;
    } else {
        outcomeText = 'Tied — no damage';
    }

    const luckRow = luckResult ? `
        <div class="combat-round-card__luck combat-round-card__luck--${luckResult.success ? 'lucky' : 'unlucky'}">
            ${luckResult.success ? 'Lucky!' : 'Unlucky!'} ${
                luckResult.context === 'wounding'
                    ? `${enemy.name} takes ${luckResult.damageAfter} damage`
                    : `You take ${luckResult.damageAfter} Stamina damage`
            }
        </div>
    ` : '';

    return `
        <div class="combat-round-card">
            <div class="combat-round-card__header">Round ${round}</div>
            <div class="combat-round-card__row">
                <span class="combat-round-card__row-label">You</span>
                <span class="die-face">${pd1}</span>
                <span class="die-face">${pd2}</span>
                <span>+ ${playerSkill} Skill</span>
                <span class="combat-round-card__as">= ${result.playerAttack}</span>
            </div>
            <div class="combat-round-card__row">
                <span class="combat-round-card__row-label">${enemy.name}</span>
                <span class="die-face">${ed1}</span>
                <span class="die-face">${ed2}</span>
                <span>+ ${enemy.skill} Skill</span>
                <span class="combat-round-card__as">= ${result.enemyAttack}</span>
            </div>
            <div class="combat-round-card__outcome combat-round-card__outcome--${result.result}">
                ${outcomeText}
            </div>
            ${luckRow}
        </div>
    `;
}

/**
 * Render a post-battle summary as an HTML string.
 * @param {string} winner - 'player' | 'enemy' | 'fled'
 * @param {number} rounds
 * @param {number} playerStaminaFinal
 * @param {number} playerStaminaInitial
 * @param {Object} enemy - { name, skill, stamina, staminaInitial }
 */
function renderSummaryHTML(winner, rounds, playerStaminaFinal, playerStaminaInitial, enemy) {
    const titleText = winner === 'player' ? 'Victory!' : winner === 'enemy' ? 'Defeated' : 'Fled';
    const titleModifier = winner === 'enemy' ? 'defeat' : winner;

    return `
        <div class="combat-summary">
            <div class="combat-summary__title combat-summary__title--${titleModifier}">
                ${titleText}
            </div>
            <div class="combat-summary__stats">
                <div>
                    <span class="combat-summary__stat-label">Rounds</span>
                    ${rounds}
                </div>
                <div>
                    <span class="combat-summary__stat-label">Your Stamina</span>
                    ${playerStaminaFinal}/${playerStaminaInitial}
                </div>
                <div>
                    <span class="combat-summary__stat-label">${enemy.name}</span>
                    ${enemy.stamina}/${enemy.staminaInitial}
                </div>
            </div>
            <button class="mechanic-btn mechanic-btn--primary" id="close-battle">Return to Sheet</button>
        </div>
    `;
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Bind the battle UI to existing DOM elements in the combat section.
 * @param {HTMLElement} container - .combat-section element
 * @param {Function} getState - returns { state, combatState, currentBook }
 * @param {Object} callbacks - { onStart, onRollRound, onFlee, onEnd, onStatSync, onCombatEnd, onTestLuck, onCombatStateChange }
 */
export function renderBattle(container, getState, callbacks, historyContainer = null) {
    if (!container) return;

    // Local mutable combat state (mirrors app.js combatState but owned by this module)
    let combatActive = false;
    let round = 0;
    let enemy = { name: '', skill: 0, stamina: 0, staminaInitial: 0 };

    // ── Element references ────────────────────────────────────────────────────

    const setupEl        = container.querySelector('#combat-setup');
    const activeEl       = container.querySelector('#combat-active');
    const statusEl       = container.querySelector('#combat-status');
    const roundResultEl  = container.querySelector('#combat-round-result');
    const combatResultEl = container.querySelector('#combat-result');
    const summaryEl      = container.querySelector('#combat-summary');
    const rollRoundBtn   = container.querySelector('#roll-round');
    const fleeBtn        = container.querySelector('#flee-combat');
    const startBtn       = container.querySelector('#start-combat');
    const enemyLabelEl   = container.querySelector('#enemy-stamina-label');

    // ── Helpers ───────────────────────────────────────────────────────────────

    function setButtonsDisabled(disabled) {
        if (rollRoundBtn) rollRoundBtn.disabled = disabled;
        if (fleeBtn) fleeBtn.disabled = disabled;
    }

    function dismissLuckPrompt() {
        const existing = container.querySelector('#luck-prompt-btn');
        if (existing) existing.remove();
    }

    function showLuckPrompt(context, currentRound, roundResult) {
        dismissLuckPrompt();

        const btn = document.createElement('button');
        btn.id = 'luck-prompt-btn';
        btn.className = 'mechanic-btn';
        btn.textContent = 'Test Your Luck?';

        btn.addEventListener('click', async () => {
            btn.disabled = true;

            const { state: luckState, currentBook } = getState();
            const luckResult = await callbacks.onTestLuck(
                currentBook,
                luckState.luck.current,
                currentRound,
                context,
                2  // damageBefore is always 2 in standard FF
            );

            // Remove the prompt button
            btn.remove();

            if (!luckResult) return;

            // Adjust enemy stamina locally if player hit enemy (wounding)
            if (context === 'wounding') {
                // Undo the standard 2 damage, apply luck-adjusted damage
                enemy.stamina = Math.max(0, enemy.stamina - luckResult.damageAfter + 2);
            }

            // Sync player stats from server (luck decremented + stamina adjusted if wounded)
            if (luckResult.session) {
                callbacks.onStatSync(luckResult.session);
            }

            // Get updated state after sync
            const { state: updatedState } = getState();
            const playerStamina = luckResult.session
                ? luckResult.session.stamina.current
                : updatedState.stamina.current;

            // Update stamina bars
            updateStaminaBars(
                container,
                playerStamina, updatedState.stamina.initial,
                enemy.stamina, enemy.staminaInitial
            );

            // Re-render round card with luck result appended (per D-06)
            if (roundResultEl) {
                roundResultEl.innerHTML = renderRoundCard(
                    currentRound, roundResult, enemy, playerStamina,
                    updatedState.skill.current,
                    { success: luckResult.success, damageAfter: luckResult.damageAfter, context }
                );
            }

            // Check for combat end after luck-adjusted damage (Risk 3 from research)
            if (playerStamina <= 0 || enemy.stamina <= 0) {
                const winner = enemy.stamina <= 0 ? 'player' : 'enemy';
                await callbacks.onEnd(
                    getState().currentBook, winner,
                    playerStamina, enemy.stamina,
                    currentRound, enemy.name
                );
                endCombatUI(winner, playerStamina);

                if (historyContainer) {
                    loadCombatHistory(getState().currentBook, historyContainer);
                }
                callbacks.onCombatEnd();
            }
        });

        // Insert button after the round card (per D-01)
        if (roundResultEl) {
            roundResultEl.appendChild(btn);
        }
    }

    function showSetup() {
        if (setupEl) setupEl.hidden = false;
        if (activeEl) activeEl.hidden = true;
    }

    function showActive() {
        if (setupEl) setupEl.hidden = true;
        if (activeEl) activeEl.hidden = false;
    }

    function endCombatUI(winner, playerStaminaFinal) {
        dismissLuckPrompt();
        combatActive = false;
        callbacks.onCombatStateChange?.(false);
        setButtonsDisabled(true);

        const { state } = getState();
        summaryEl.innerHTML = renderSummaryHTML(
            winner,
            round,
            playerStaminaFinal,
            state.stamina.initial,
            enemy
        );
        summaryEl.hidden = false;

        // Bind New Battle button
        const newBattleBtn = summaryEl.querySelector('#new-battle');
        if (newBattleBtn) {
            newBattleBtn.addEventListener('click', () => {
                showSetup();
                summaryEl.hidden = true;
                summaryEl.innerHTML = '';
                if (roundResultEl) roundResultEl.innerHTML = '';
                if (combatResultEl) combatResultEl.textContent = '';
                setButtonsDisabled(false);
            });
        }
    }

    // ── Start Combat ─────────────────────────────────────────────────────────

    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            const { state, currentBook } = getState();
            if (!currentBook) return;

            const nameVal    = container.querySelector('#enemy-name')?.value.trim() || 'Enemy';
            const skillVal   = parseInt(container.querySelector('#enemy-skill')?.value, 10) || 8;
            const staminaVal = parseInt(container.querySelector('#enemy-stamina')?.value, 10) || 8;

            // Initialise local combat state
            combatActive = true;
            callbacks.onCombatStateChange?.(true);
            round = 1;
            enemy = { name: nameVal, skill: skillVal, stamina: staminaVal, staminaInitial: staminaVal };

            await callbacks.onStart(currentBook, nameVal, skillVal, staminaVal);

            showActive();

            // Initialise stamina bars
            updateStaminaBars(
                container,
                state.stamina.current, state.stamina.initial,
                enemy.stamina, enemy.staminaInitial
            );

            if (statusEl) statusEl.textContent = `Round 1`;
            if (enemyLabelEl) enemyLabelEl.textContent = enemy.name;
            if (roundResultEl) roundResultEl.innerHTML = '';
            if (combatResultEl) combatResultEl.textContent = '';
            if (summaryEl) { summaryEl.hidden = true; summaryEl.innerHTML = ''; }
            setButtonsDisabled(false);
        });
    }

    // ── Roll Round ───────────────────────────────────────────────────────────

    if (rollRoundBtn) {
        rollRoundBtn.addEventListener('click', async () => {
            dismissLuckPrompt();
            if (!combatActive) return;

            const { state, currentBook } = getState();
            if (!currentBook) return;

            setButtonsDisabled(true);

            const r = await callbacks.onRollRound(currentBook, state.skill.current, round, enemy);

            // Update enemy stamina from result
            enemy.stamina = r.enemyStaminaAfter;

            // Sync player stamina from server
            if (r.session) {
                callbacks.onStatSync(r.session);
            }

            // Authoritative player stamina
            const playerStamina = r.session
                ? r.session.stamina.current
                : state.stamina.current;

            // Update stamina bars (re-read state for initial after sync)
            const { state: updatedState } = getState();
            updateStaminaBars(
                container,
                playerStamina, updatedState.stamina.initial,
                enemy.stamina, enemy.staminaInitial
            );

            // Render round card
            if (roundResultEl) {
                roundResultEl.innerHTML = renderRoundCard(
                    round, r, enemy, playerStamina, updatedState.skill.current
                );
            }

            // Brief aria-live result text
            if (combatResultEl) {
                if (r.result === 'player_hit') {
                    combatResultEl.textContent = `Round ${round}: You hit!`;
                } else if (r.result === 'enemy_hit') {
                    combatResultEl.textContent = `Round ${round}: ${enemy.name} hits!`;
                } else {
                    combatResultEl.textContent = `Round ${round}: Tied.`;
                }
            }

            // Show luck prompt if this round was a hit (per D-01, D-02)
            if (r.result !== 'tie') {
                const context = r.result === 'player_hit' ? 'wounding' : 'wounded';
                showLuckPrompt(context, round, r);
            }

            // Check for combat end
            if (playerStamina <= 0 || enemy.stamina <= 0) {
                const winner = enemy.stamina <= 0 ? 'player' : 'enemy';
                await callbacks.onEnd(
                    currentBook, winner,
                    playerStamina, enemy.stamina,
                    round, enemy.name
                );
                endCombatUI(winner, playerStamina);

                // Refresh history
                if (historyContainer) {
                    loadCombatHistory(currentBook, historyContainer);
                }

                callbacks.onCombatEnd();
                return;
            }

            round++;
            if (statusEl) statusEl.textContent = `Round ${round}`;
            setButtonsDisabled(false);
        });
    }

    // ── Flee ─────────────────────────────────────────────────────────────────

    if (fleeBtn) {
        fleeBtn.addEventListener('click', async () => {
            if (!combatActive) return;

            const { state, currentBook } = getState();
            if (!currentBook) return;

            setButtonsDisabled(true);

            const r = await callbacks.onFlee(
                currentBook, 'fled',
                state.stamina.current, enemy.stamina,
                round, enemy.name
            );

            if (r && r.session) {
                callbacks.onStatSync(r.session);
            }

            const playerStamina = (r && r.session)
                ? r.session.stamina.current
                : Math.max(0, state.stamina.current - 2);

            const { state: updatedState } = getState();
            updateStaminaBars(
                container,
                playerStamina, updatedState.stamina.initial,
                enemy.stamina, enemy.staminaInitial
            );

            endCombatUI('fled', playerStamina);

            if (historyContainer) {
                loadCombatHistory(currentBook, historyContainer);
            }

            callbacks.onCombatEnd();
        });
    }

    // Load battle history on init
    const { currentBook } = getState();
    if (currentBook && historyContainer) {
        loadCombatHistory(currentBook, historyContainer);
    }
}

// ── Internal history helpers ──────────────────────────────────────────────────

/**
 * Render a single round log entry as an HTML string.
 */
function renderRoundEntry(roundLog, luckLog = null) {
    const d = roundLog.details || {};
    const r = d.round ?? '?';
    const pa = d.player_attack ?? '?';
    const ea = d.enemy_attack ?? '?';
    const resultText = d.result === 'player_hit'
        ? 'You hit'
        : d.result === 'enemy_hit'
            ? 'Enemy hit'
            : 'Tie';
    const luckSuffix = luckLog
        ? ` — ${luckLog.details.success ? 'Lucky' : 'Unlucky'} (${luckLog.details.damage_after} dmg)`
        : '';
    return `<div class="combat-log__entry">R${r}: AS ${pa} vs ${ea} — ${resultText}${luckSuffix}</div>`;
}

/**
 * Render a grouped battle (start + rounds + optional end) as an HTML string.
 */
function renderBattleEntry(battle) {
    const sd = battle.start.details || {};
    const enemyName    = sd.enemy_name    ?? 'Enemy';
    const enemySkill   = sd.enemy_skill   ?? '?';
    const enemyStamina = sd.enemy_stamina ?? '?';

    let outcome = 'In progress';
    if (battle.end) {
        const ed = battle.end.details || {};
        const w = ed.winner;
        outcome = w === 'player' ? 'Victory' : w === 'enemy' ? 'Defeat' : w === 'fled' ? 'Fled' : 'Unknown';
    }

    const luckByRound = {};
    (battle.luckTests || []).forEach(lt => {
        const d = lt.details || {};
        luckByRound[d.round] = lt;
    });
    const roundsHTML = battle.rounds.map(r => renderRoundEntry(r, luckByRound[(r.details || {}).round] ?? null)).join('');

    return `
        <div class="combat-log__battle">
            <div class="combat-log__battle-header">
                vs ${enemyName} (Skill ${enemySkill}, Stamina ${enemyStamina}) — ${outcome}
            </div>
            ${roundsHTML}
        </div>
    `;
}

// ── Exported: loadCombatHistory ───────────────────────────────────────────────

/**
 * Fetch past combat logs for a book session and render them into the history container.
 * Fails silently — history is non-critical.
 * @param {number|string} bookNumber
 * @param {HTMLElement} historyContainer - #combat-history element
 */
export async function loadCombatHistory(bookNumber, historyContainer) {
    if (!bookNumber || !historyContainer) return;

    try {
        const res = await fetch(`/api/sessions/${bookNumber}/logs`);
        if (!res.ok) {
            historyContainer.innerHTML = '';
            return;
        }
        const logs = await res.json();

        // Filter to combat logs only
        const combatLogs = logs.filter(l =>
            l.action_type === 'combat_start' ||
            l.action_type === 'combat_round' ||
            l.action_type === 'combat_end' ||
            l.action_type === 'combat_luck_test'
        );

        // API returns newest first (id DESC) — reverse to chronological
        combatLogs.reverse();

        // Group into battles by combat_start markers
        const battles = [];
        let current = null;
        for (const log of combatLogs) {
            if (log.action_type === 'combat_start') {
                current = { start: log, rounds: [], luckTests: [], end: null };
                battles.push(current);
            } else if (current && log.action_type === 'combat_round') {
                current.rounds.push(log);
            } else if (current && log.action_type === 'combat_luck_test') {
                current.luckTests.push(log);
            } else if (current && log.action_type === 'combat_end') {
                current.end = log;
                current = null;
            }
        }

        if (battles.length === 0) {
            historyContainer.innerHTML = '<p class="combat-log__entry">No battles yet.</p>';
            return;
        }

        // Most recent first for display
        battles.reverse();

        historyContainer.innerHTML = `
            <div class="combat-log">
                <div class="combat-log__title" id="combat-log-toggle">Past Battles (${battles.length})</div>
                <div class="combat-log__battles" id="combat-log-list" hidden>
                    ${battles.map(b => renderBattleEntry(b)).join('')}
                </div>
            </div>
        `;

        // Toggle expand/collapse
        const toggleEl = historyContainer.querySelector('#combat-log-toggle');
        const listEl   = historyContainer.querySelector('#combat-log-list');
        if (toggleEl && listEl) {
            toggleEl.addEventListener('click', () => {
                if (listEl.hidden) {
                    listEl.hidden = false;
                    toggleEl.classList.add('expanded');
                } else {
                    listEl.hidden = true;
                    toggleEl.classList.remove('expanded');
                }
            });
        }
    } catch {
        historyContainer.innerHTML = '';
    }
}
