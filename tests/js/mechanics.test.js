import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../js/dice.js', () => ({
    rollMultiple: vi.fn(),
    roll: vi.fn(),
    rollInitialStats: vi.fn(),
}));

import { rollMultiple } from '../../js/dice.js';
import { testSkill, testLuck, testCombatLuck, rollCombatRound } from '../../js/mechanics.js';

const mockSession = { skill: 7, stamina: 18, luck: 8 };

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ session: mockSession }),
    }));
});

describe('testSkill', () => {
    it('succeeds when roll is less than skill', async () => {
        rollMultiple.mockReturnValue(5);
        const result = await testSkill(1, 7);
        expect(result.success).toBe(true);
        expect(result.roll).toBe(5);
        expect(result.target).toBe(7);
    });

    it('succeeds on exact match', async () => {
        rollMultiple.mockReturnValue(7);
        const result = await testSkill(1, 7);
        expect(result.success).toBe(true);
    });

    it('fails when roll exceeds skill', async () => {
        rollMultiple.mockReturnValue(9);
        const result = await testSkill(1, 7);
        expect(result.success).toBe(false);
    });
});

describe('testLuck', () => {
    it('succeeds when roll is within luck', async () => {
        rollMultiple.mockReturnValue(6);
        const result = await testLuck(1, 8);
        expect(result.success).toBe(true);
    });

    it('fails when roll exceeds luck', async () => {
        rollMultiple.mockReturnValue(10);
        const result = await testLuck(1, 8);
        expect(result.success).toBe(false);
    });

    it('always decrements luck by 1 on success', async () => {
        rollMultiple.mockReturnValue(6);
        const result = await testLuck(1, 8);
        expect(result.luckAfter).toBe(7);
    });

    it('always decrements luck by 1 on failure', async () => {
        rollMultiple.mockReturnValue(10);
        const result = await testLuck(1, 8);
        expect(result.luckAfter).toBe(7);
    });

    it('luck floor is 0 — cannot go negative', async () => {
        rollMultiple.mockReturnValue(3);
        const result = await testLuck(1, 0);
        expect(result.luckAfter).toBe(0);
    });
});

describe('testCombatLuck — wounding context (player struck enemy)', () => {
    it('deals 4 damage on lucky wound', async () => {
        rollMultiple.mockReturnValue(5);
        const result = await testCombatLuck(1, 8, 1, 'wounding', 2);
        expect(result.success).toBe(true);
        expect(result.damageAfter).toBe(4);
    });

    it('deals only 1 damage on unlucky wound', async () => {
        rollMultiple.mockReturnValue(10);
        const result = await testCombatLuck(1, 8, 1, 'wounding', 2);
        expect(result.success).toBe(false);
        expect(result.damageAfter).toBe(1);
    });
});

describe('testCombatLuck — damage context (player was struck)', () => {
    it('takes only 1 damage on lucky escape', async () => {
        rollMultiple.mockReturnValue(5);
        const result = await testCombatLuck(1, 8, 1, 'damage', 2);
        expect(result.success).toBe(true);
        expect(result.damageAfter).toBe(1);
    });

    it('takes 3 damage on unlucky escape', async () => {
        rollMultiple.mockReturnValue(10);
        const result = await testCombatLuck(1, 8, 1, 'damage', 2);
        expect(result.success).toBe(false);
        expect(result.damageAfter).toBe(3);
    });

    it('always decrements luck', async () => {
        rollMultiple.mockReturnValue(5);
        const result = await testCombatLuck(1, 8, 1, 'damage', 2);
        expect(result.luckAfter).toBe(7);
    });
});

describe('rollCombatRound', () => {
    const enemy = { skill: 5, stamina: 10, name: 'Orc' };

    it('player wins when playerAttack > enemyAttack', async () => {
        rollMultiple.mockReturnValueOnce(6).mockReturnValueOnce(2);
        const result = await rollCombatRound(1, 7, 1, enemy);
        expect(result.result).toBe('player_hit');
        expect(result.playerAttack).toBe(13); // 6 + 7
        expect(result.enemyAttack).toBe(7);   // 2 + 5
    });

    it('enemy wins when enemyAttack > playerAttack', async () => {
        rollMultiple.mockReturnValueOnce(2).mockReturnValueOnce(6);
        const result = await rollCombatRound(1, 5, 1, { ...enemy, skill: 8 });
        expect(result.result).toBe('enemy_hit');
    });

    it('tie when attacks are equal', async () => {
        rollMultiple.mockReturnValueOnce(4).mockReturnValueOnce(4);
        const result = await rollCombatRound(1, 7, 1, { ...enemy, skill: 7 });
        expect(result.result).toBe('tie');
    });

    it('reduces enemy stamina by 2 on player_hit', async () => {
        rollMultiple.mockReturnValueOnce(6).mockReturnValueOnce(2);
        const result = await rollCombatRound(1, 7, 1, enemy);
        expect(result.enemyStaminaAfter).toBe(8);
    });

    it('enemy stamina cannot go below 0', async () => {
        rollMultiple.mockReturnValueOnce(6).mockReturnValueOnce(2);
        const result = await rollCombatRound(1, 7, 1, { ...enemy, stamina: 1 });
        expect(result.enemyStaminaAfter).toBe(0);
    });

    it('does not reduce enemy stamina on enemy_hit', async () => {
        rollMultiple.mockReturnValueOnce(2).mockReturnValueOnce(6);
        const result = await rollCombatRound(1, 5, 1, { ...enemy, skill: 8 });
        expect(result.enemyStaminaAfter).toBe(10);
    });

    it('does not reduce enemy stamina on tie', async () => {
        rollMultiple.mockReturnValueOnce(4).mockReturnValueOnce(4);
        const result = await rollCombatRound(1, 7, 1, { ...enemy, skill: 7 });
        expect(result.enemyStaminaAfter).toBe(10);
    });
});
