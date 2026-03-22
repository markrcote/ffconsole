/**
 * Fighting Fantasy mechanics: skill/stamina/luck tests and combat.
 * All actions are POSTed to the backend for logging; stat mutations
 * (luck deduction, stamina damage) are applied server-side atomically.
 */

import { rollMultiple } from './dice.js';

async function postAction(bookNumber, actionType, details) {
    try {
        const res = await fetch(`/api/sessions/${bookNumber}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_type: actionType, details }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function testSkill(bookNumber, skillCurrent) {
    const roll = rollMultiple(2);
    const success = roll <= skillCurrent;
    const result = await postAction(bookNumber, 'skill_test', {
        roll, target: skillCurrent, success,
    });
    return { roll, target: skillCurrent, success, session: result?.session ?? null };
}

export async function testStamina(bookNumber, staminaCurrent) {
    const roll = rollMultiple(2);
    const success = roll <= staminaCurrent;
    const result = await postAction(bookNumber, 'stamina_test', {
        roll, target: staminaCurrent, success,
    });
    return { roll, target: staminaCurrent, success, session: result?.session ?? null };
}

export async function testLuck(bookNumber, luckCurrent) {
    const roll = rollMultiple(2);
    const success = roll <= luckCurrent;
    const luckAfter = Math.max(0, luckCurrent - 1);
    const result = await postAction(bookNumber, 'luck_test', {
        roll, target: luckCurrent, success, luck_after: luckAfter,
    });
    return { roll, target: luckCurrent, success, luckAfter, session: result?.session ?? null };
}

export async function startCombat(bookNumber, enemyName, enemySkill, enemyStamina) {
    const result = await postAction(bookNumber, 'combat_start', {
        enemy_name: enemyName, enemy_skill: enemySkill, enemy_stamina: enemyStamina,
    });
    return { session: result?.session ?? null };
}

export async function rollCombatRound(bookNumber, playerSkill, round, enemyState) {
    const playerRoll = rollMultiple(2);
    const enemyRoll = rollMultiple(2);
    const playerAttack = playerRoll + playerSkill;
    const enemyAttack = enemyRoll + enemyState.skill;

    let combatResult;
    if (playerAttack > enemyAttack) combatResult = 'player_hit';
    else if (enemyAttack > playerAttack) combatResult = 'enemy_hit';
    else combatResult = 'tie';

    const enemyStaminaAfter = Math.max(0, enemyState.stamina - (combatResult === 'player_hit' ? 2 : 0));

    const result = await postAction(bookNumber, 'combat_round', {
        round,
        player_roll: playerRoll,
        enemy_roll: enemyRoll,
        player_attack: playerAttack,
        enemy_attack: enemyAttack,
        result: combatResult,
        player_stamina_after: null, // filled by server from session
        enemy_stamina_after: enemyStaminaAfter,
        enemy_name: enemyState.name,
    });

    return {
        playerRoll, enemyRoll, playerAttack, enemyAttack,
        result: combatResult, enemyStaminaAfter,
        session: result?.session ?? null,
    };
}

export async function endCombat(bookNumber, winner, finalPlayerStamina, finalEnemyStamina, rounds, enemyName) {
    const result = await postAction(bookNumber, 'combat_end', {
        winner,
        final_player_stamina: finalPlayerStamina,
        final_enemy_stamina: finalEnemyStamina,
        rounds,
        enemy_name: enemyName,
    });
    return { session: result?.session ?? null };
}
