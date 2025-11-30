import { describe, it, expect, beforeEach } from 'vitest';
import { DataFrame } from '../core/DataFrame';

// Define a sample interface for testing
interface Person extends Record<string, any> {
    name: string;
    age: number;
    city: string;
}

describe('DataFrame', () => {
    const sampleData: Person[] = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'London' },
        { name: 'Charlie', age: 35, city: 'Tokyo' },
    ];

    describe('construction', () => {
        it('should create a DataFrame from an array of objects', () => {
            const df = new DataFrame(sampleData);
            expect(df.length).toBe(3);
            expect(df.width).toBe(3);
        });

        it('should handle empty array', () => {
            const df = new DataFrame<Person>([]);
            expect(df.length).toBe(0);
            expect(df.width).toBe(0);
        });

        it('should extract column names from first row', () => {
            const df = new DataFrame(sampleData);
            const columns = df.getColumnNames();
            expect(columns).toEqual(['name', 'age', 'city']);
        });
    });

    describe('basic operations', () => {
        let df: DataFrame<Person>;

        beforeEach(() => {
            df = new DataFrame(sampleData);
        });

        it('should return correct length', () => {
            expect(df.length).toBe(3);
        });

        it('should return correct width', () => {
            expect(df.width).toBe(3);
        });

        it('should return all rows', () => {
            const rows = df.getRows();
            expect(rows).toEqual(sampleData);
            expect(rows).toHaveLength(3);
        });

        it('should return column names', () => {
            const columns = df.getColumnNames();
            expect(columns).toContain('name');
            expect(columns).toContain('age');
            expect(columns).toContain('city');
        });
    });

    describe('column operations', () => {
        let df: DataFrame<Person>;

        beforeEach(() => {
            df = new DataFrame(sampleData);
        });

        it('should get a specific column', () => {
            const names = df.getColumn('name');
            expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        it('should get numeric column', () => {
            const ages = df.getColumn('age');
            expect(ages).toEqual([30, 25, 35]);
        });

        it('should select single column', () => {
            const selected = df.select('name');
            expect(selected.length).toBe(3);
            expect(selected.width).toBe(1);
            expect(selected.getColumnNames()).toEqual(['name']);
            expect(selected.getColumn('name')).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        it('should select multiple columns', () => {
            const selected = df.select('name', 'age');
            expect(selected.length).toBe(3);
            expect(selected.width).toBe(2);
            expect(selected.getColumnNames()).toEqual(['name', 'age']);
            expect(selected.getColumn('name')).toEqual(['Alice', 'Bob', 'Charlie']);
            expect(selected.getColumn('age')).toEqual([30, 25, 35]);
        });

        it('should throw error when selecting non-existent column', () => {
            expect(() => df.select('nonexistent' as keyof Person)).toThrow(
                'Column "nonexistent" does not exist'
            );
        });

        it('should throw error when selecting no columns', () => {
            expect(() => df.select()).toThrow('At least one column must be selected');
        });
    });
});

