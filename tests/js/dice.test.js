import { describe, it, expect } from 'vitest';
import { roll, rollMultiple, rollInitialStats } from '../../js/dice.js';

describe('roll', () => {
    it('returns a value between 1 and 6 by default', () => {
        for (let i = 0; i < 200; i++) {
            const r = roll();
            expect(r).toBeGreaterThanOrEqual(1);
            expect(r).toBeLessThanOrEqual(6);
        }
    });

    it('respects custom sides', () => {
        for (let i = 0; i < 200; i++) {
            const r = roll(12);
            expect(r).toBeGreaterThanOrEqual(1);
            expect(r).toBeLessThanOrEqual(12);
        }
    });

    it('always returns an integer', () => {
        for (let i = 0; i < 50; i++) {
            expect(Number.isInteger(roll())).toBe(true);
        }
    });
});

describe('rollMultiple', () => {
    it('2d6 stays in range 2-12', () => {
        for (let i = 0; i < 200; i++) {
            const r = rollMultiple(2);
            expect(r).toBeGreaterThanOrEqual(2);
            expect(r).toBeLessThanOrEqual(12);
        }
    });

    it('3d6 stays in range 3-18', () => {
        for (let i = 0; i < 200; i++) {
            const r = rollMultiple(3, 6);
            expect(r).toBeGreaterThanOrEqual(3);
            expect(r).toBeLessThanOrEqual(18);
        }
    });

    it('always returns an integer', () => {
        for (let i = 0; i < 50; i++) {
            expect(Number.isInteger(rollMultiple(2))).toBe(true);
        }
    });
});

describe('rollInitialStats', () => {
    it('returns skill, stamina, and luck', () => {
        const stats = rollInitialStats();
        expect(stats).toHaveProperty('skill');
        expect(stats).toHaveProperty('stamina');
        expect(stats).toHaveProperty('luck');
    });

    it('skill is 1d6+6 (range 7-12)', () => {
        for (let i = 0; i < 200; i++) {
            const { skill } = rollInitialStats();
            expect(skill).toBeGreaterThanOrEqual(7);
            expect(skill).toBeLessThanOrEqual(12);
        }
    });

    it('stamina is 2d6+12 (range 14-24)', () => {
        for (let i = 0; i < 200; i++) {
            const { stamina } = rollInitialStats();
            expect(stamina).toBeGreaterThanOrEqual(14);
            expect(stamina).toBeLessThanOrEqual(24);
        }
    });

    it('luck is 1d6+6 (range 7-12)', () => {
        for (let i = 0; i < 200; i++) {
            const { luck } = rollInitialStats();
            expect(luck).toBeGreaterThanOrEqual(7);
            expect(luck).toBeLessThanOrEqual(12);
        }
    });
});
