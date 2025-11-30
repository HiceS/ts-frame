import { describe, it, expect, beforeEach } from 'vitest';
import { DataFrame } from '../core/DataFrame';
import { isNull, isNaN, notNull, hasNull, hasNaN, countNull, countNaN } from './validation';

describe('null and NaN detection', () => {
    interface TestData extends Record<string, any> {
        name: string | null;
        age: number | null;
        score: number;
        city: string | undefined;
    }

    const testData: TestData[] = [
        { name: 'Alice', age: 30, score: 95, city: 'New York' },
        { name: null, age: null, score: Number.NaN, city: undefined },
        { name: 'Bob', age: 25, score: 88, city: 'London' },
    ];

    let df: DataFrame<TestData>;

    beforeEach(() => {
        df = new DataFrame(testData);
    });

    describe('isNull', () => {
        it('should return boolean array for null values', () => {
            const nullMask = isNull(df, 'name');
            expect(nullMask).toEqual([false, true, false]);
        });

        it('should detect undefined values as null', () => {
            const nullMask = isNull(df, 'city');
            expect(nullMask).toEqual([false, true, false]);
        });

        it('should handle columns with no nulls', () => {
            // Note: score has NaN but no nulls
            const nullMask = isNull(df, 'score');
            expect(nullMask).toEqual([false, false, false]);
        });
    });

    describe('isNaN', () => {
        it('should return boolean array for NaN values', () => {
            const nanMask = isNaN(df, 'score');
            expect(nanMask).toEqual([false, true, false]);
        });

        it('should not treat null as NaN', () => {
            const nanMask = isNaN(df, 'age');
            expect(nanMask).toEqual([false, false, false]);
        });

        it('should handle columns with no NaN', () => {
            const nanMask = isNaN(df, 'name');
            expect(nanMask).toEqual([false, false, false]);
        });
    });

    describe('notNull', () => {
        it('should return inverse of isNull', () => {
            const notNullMask = notNull(df, 'name');
            expect(notNullMask).toEqual([true, false, true]);
        });
    });

    describe('hasNull', () => {
        it('should return true if column has null values', () => {
            expect(hasNull(df, 'name')).toBe(true);
            expect(hasNull(df, 'age')).toBe(true);
            expect(hasNull(df, 'city')).toBe(true);
        });

        it('should return false if column has no null values', () => {
            // score has NaN but no nulls
            expect(hasNull(df, 'score')).toBe(false);
        });
    });

    describe('hasNaN', () => {
        it('should return true if column has NaN values', () => {
            expect(hasNaN(df, 'score')).toBe(true);
        });

        it('should return false if column has no NaN values', () => {
            expect(hasNaN(df, 'name')).toBe(false);
            expect(hasNaN(df, 'age')).toBe(false);
        });
    });

    describe('countNull', () => {
        it('should count null values in column', () => {
            expect(countNull(df, 'name')).toBe(1);
            expect(countNull(df, 'age')).toBe(1);
            expect(countNull(df, 'city')).toBe(1);
            expect(countNull(df, 'score')).toBe(0);
        });

        it('should handle multiple nulls', () => {
            interface MultiNullData extends Record<string, any> {
                value: number | null;
            }
            const data: MultiNullData[] = [
                { value: 1 },
                { value: null },
                { value: null },
                { value: 3 },
            ];
            const testDf = new DataFrame(data);
            expect(countNull(testDf, 'value')).toBe(2);
        });
    });

    describe('countNaN', () => {
        it('should count NaN values in column', () => {
            expect(countNaN(df, 'score')).toBe(1);
            expect(countNaN(df, 'name')).toBe(0);
        });

        it('should handle multiple NaNs', () => {
            interface MultiNaNData extends Record<string, any> {
                value: number;
            }
            const data: MultiNaNData[] = [
                { value: 1 },
                { value: Number.NaN },
                { value: Number.NaN },
                { value: 3 },
            ];
            const testDf = new DataFrame(data);
            expect(countNaN(testDf, 'value')).toBe(2);
        });
    });

    it('should throw error for non-existent column', () => {
        expect(() => isNull(df, 'nonexistent' as keyof TestData)).toThrow(
            'Column "nonexistent" does not exist'
        );
        expect(() => isNaN(df, 'nonexistent' as keyof TestData)).toThrow(
            'Column "nonexistent" does not exist'
        );
        expect(() => hasNull(df, 'nonexistent' as keyof TestData)).toThrow(
            'Column "nonexistent" does not exist'
        );
        expect(() => hasNaN(df, 'nonexistent' as keyof TestData)).toThrow(
            'Column "nonexistent" does not exist'
        );
        expect(() => countNull(df, 'nonexistent' as keyof TestData)).toThrow(
            'Column "nonexistent" does not exist'
        );
        expect(() => countNaN(df, 'nonexistent' as keyof TestData)).toThrow(
            'Column "nonexistent" does not exist'
        );
    });
});

