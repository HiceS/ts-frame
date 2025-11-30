import { describe, it, expect, beforeEach } from 'vitest';
import { DataFrame } from '../core/DataFrame';
import { isNumeric, isString, getColumnType } from './types';

// Define a sample interface for testing
interface Person extends Record<string, any> {
    name: string;
    age: number;
    city: string;
}

describe('column type checking', () => {
    const sampleData: Person[] = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'London' },
        { name: 'Charlie', age: 35, city: 'Tokyo' },
    ];

    let df: DataFrame<Person>;

    beforeEach(() => {
        df = new DataFrame(sampleData);
    });

    it('should identify numeric columns', () => {
        expect(isNumeric(df, 'age')).toBe(true);
        expect(isNumeric(df, 'name')).toBe(false);
        expect(isNumeric(df, 'city')).toBe(false);
    });

    it('should identify string columns', () => {
        expect(isString(df, 'name')).toBe(true);
        expect(isString(df, 'city')).toBe(true);
        expect(isString(df, 'age')).toBe(false);
    });

    it('should handle numeric columns with null values', () => {
        interface TestData extends Record<string, any> {
            value: number | null;
        }
        const data: TestData[] = [
            { value: 10 },
            { value: null },
            { value: 20 },
        ];
        const testDf = new DataFrame(data);
        expect(isNumeric(testDf, 'value')).toBe(true);
    });

    it('should return column type', () => {
        expect(getColumnType(df, 'age')).toBe('number');
        expect(getColumnType(df, 'name')).toBe('string');
        expect(getColumnType(df, 'city')).toBe('string');
    });

    it('should identify mixed type columns', () => {
        interface TestData extends Record<string, any> {
            mixed: string | number;
        }
        const data: TestData[] = [
            { mixed: 'hello' },
            { mixed: 42 },
        ];
        const testDf = new DataFrame(data);
        expect(getColumnType(testDf, 'mixed')).toBe('mixed');
    });

    it('should return empty for empty DataFrame', () => {
        const emptyDf = new DataFrame<Person>([]);
        // Empty DataFrame has no columns, so we can't check column type
        // This is expected behavior - empty DataFrame has no column information
        expect(emptyDf.width).toBe(0);
        expect(() => getColumnType(emptyDf, 'name' as keyof Person)).toThrow(
            'Column "name" does not exist'
        );
    });

    it('should throw error for non-existent column', () => {
        expect(() => isNumeric(df, 'nonexistent' as keyof Person)).toThrow(
            'Column "nonexistent" does not exist'
        );
        expect(() => isString(df, 'nonexistent' as keyof Person)).toThrow(
            'Column "nonexistent" does not exist'
        );
        expect(() => getColumnType(df, 'nonexistent' as keyof Person)).toThrow(
            'Column "nonexistent" does not exist'
        );
    });
});

