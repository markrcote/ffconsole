import { describe, it, expect } from 'vitest';
import { BOOKS, getBook, searchBooks } from '../../js/books.js';

describe('getBook', () => {
    it('returns the correct book by number', () => {
        expect(getBook(1)).toEqual({ number: 1, title: 'The Warlock of Firetop Mountain' });
    });

    it('returns undefined for an unknown book number', () => {
        expect(getBook(999)).toBeUndefined();
    });

    it('returns the last book in the list', () => {
        const last = BOOKS[BOOKS.length - 1];
        expect(getBook(last.number)).toEqual(last);
    });
});

describe('searchBooks', () => {
    it('returns all books for an empty query', () => {
        expect(searchBooks('')).toHaveLength(BOOKS.length);
    });

    it('returns all books for a whitespace-only query', () => {
        expect(searchBooks('   ')).toHaveLength(BOOKS.length);
    });

    it('finds a book by exact number', () => {
        const results = searchBooks('1');
        expect(results.some(b => b.number === 1)).toBe(true);
    });

    it('number query with exact match returns that book first', () => {
        const results = searchBooks('6');
        expect(results[0].number).toBe(6);
    });

    it('finds books by partial title (case-insensitive)', () => {
        const results = searchBooks('warlock');
        expect(results.some(b => b.number === 1)).toBe(true);
    });

    it('is case-insensitive', () => {
        expect(searchBooks('WARLOCK')).toEqual(searchBooks('warlock'));
    });

    it('returns empty array when nothing matches', () => {
        expect(searchBooks('xyzzynotabook')).toHaveLength(0);
    });

    it('"firetop" matches both book 1 and book 50', () => {
        const results = searchBooks('firetop');
        const numbers = results.map(b => b.number);
        expect(numbers).toContain(1);
        expect(numbers).toContain(50);
    });

    it('title search trims surrounding whitespace', () => {
        expect(searchBooks('  warlock  ')).toEqual(searchBooks('warlock'));
    });
});
