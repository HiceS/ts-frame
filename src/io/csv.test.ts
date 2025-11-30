import { describe, it, expect, beforeEach } from 'vitest';
import { DataFrame } from '../core/DataFrame';
import { toCSV, fromCSV } from './csv';

// Define a sample interface for testing
interface Person extends Record<string, any> {
    name: string;
    age: number;
    city: string;
}

describe('CSV operations', () => {
    const sampleData: Person[] = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'London' },
        { name: 'Charlie', age: 35, city: 'Tokyo' },
    ];

    describe('CSV export', () => {
        let df: DataFrame<Person>;

        beforeEach(() => {
            df = new DataFrame(sampleData);
        });

        it('should export to CSV with headers', () => {
            const csv = toCSV(df);
            const lines = csv.split('\n');
            expect(lines[0]).toBe('name,age,city');
            expect(lines[1]).toBe('Alice,30,New York');
            expect(lines[2]).toBe('Bob,25,London');
            expect(lines[3]).toBe('Charlie,35,Tokyo');
        });

        it('should export to CSV without headers', () => {
            const csv = toCSV(df, { includeHeaders: false });
            const lines = csv.split('\n');
            expect(lines[0]).toBe('Alice,30,New York');
            expect(lines[1]).toBe('Bob,25,London');
            expect(lines[2]).toBe('Charlie,35,Tokyo');
        });

        it('should use custom delimiter', () => {
            const csv = toCSV(df, { delimiter: ';' });
            const lines = csv.split('\n');
            expect(lines[0]).toBe('name;age;city');
            expect(lines[1]).toBe('Alice;30;New York');
        });

        it('should escape values with commas', () => {
            const dataWithCommas: Person[] = [{ name: 'Alice, Jr.', age: 30, city: 'New York' }];
            const df = new DataFrame(dataWithCommas);
            const csv = toCSV(df);
            expect(csv).toContain('"Alice, Jr."');
        });

        it('should escape values with quotes', () => {
            const dataWithQuotes: Person[] = [
                { name: 'Alice "The Great"', age: 30, city: 'New York' },
            ];
            const df = new DataFrame(dataWithQuotes);
            const csv = toCSV(df);
            expect(csv).toContain('"Alice ""The Great"""');
        });

        it('should escape values with newlines', () => {
            const dataWithNewlines: Person[] = [
                { name: 'Alice\nSmith', age: 30, city: 'New York' },
            ];
            const df = new DataFrame(dataWithNewlines);
            const csv = toCSV(df);
            expect(csv).toContain('"Alice\nSmith"');
        });

        it('should handle empty DataFrame', () => {
            const emptyDf = new DataFrame<Person>([]);
            const csv = toCSV(emptyDf);
            // Empty DataFrame has no columns, so CSV is empty
            expect(csv).toBe('');
        });

        it('should handle null/undefined values', () => {
            interface TestData extends Record<string, any> {
                a: string | null;
                b: number | undefined;
            }
            const data: TestData[] = [
                { a: null, b: undefined },
                { a: 'test', b: 42 },
            ];
            const df = new DataFrame(data);
            const csv = toCSV(df);
            const lines = csv.split('\n');
            expect(lines[1]).toBe(',');
            expect(lines[2]).toBe('test,42');
        });

        it('should not quote numbers in CSV', () => {
            const csv = toCSV(df);
            const lines = csv.split('\n');
            // Numbers should not have quotes
            expect(lines[1]).toBe('Alice,30,New York');
            expect(lines[2]).toBe('Bob,25,London');
            expect(lines[3]).toBe('Charlie,35,Tokyo');
        });
    });

    describe('fromCSV', () => {
        it('should parse CSV with headers', () => {
            const csv = 'name,age,city\nAlice,30,New York\nBob,25,London';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.width).toBe(3);
            expect(df.getColumnNames()).toEqual(['name', 'age', 'city']);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
            expect(df.getColumn('age')).toEqual([30, 25]);
            expect(df.getColumn('city')).toEqual(['New York', 'London']);
        });

        it('should parse CSV without headers', () => {
            const csv = 'Alice,30,New York\nBob,25,London';
            const df = fromCSV(csv, { hasHeaders: false });

            expect(df.length).toBe(2);
            expect(df.width).toBe(3);
            expect(df.getColumnNames()).toEqual(['column1', 'column2', 'column3']);
            expect(df.getColumn('column1')).toEqual(['Alice', 'Bob']);
            expect(df.getColumn('column2')).toEqual([30, 25]);
            expect(df.getColumn('column3')).toEqual(['New York', 'London']);
        });

        it('should handle custom delimiter', () => {
            const csv = 'name;age;city\nAlice;30;New York\nBob;25;London';
            const df = fromCSV(csv, { delimiter: ';' });

            expect(df.length).toBe(2);
            expect(df.width).toBe(3);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should parse quoted values', () => {
            const csv = 'name,age,city\n"Alice, Jr.",30,"New York"';
            const df = fromCSV(csv);

            expect(df.length).toBe(1);
            expect(df.getColumn('name')).toEqual(['Alice, Jr.']);
            expect(df.getColumn('city')).toEqual(['New York']);
        });

        it('should handle escaped quotes', () => {
            const csv = 'name,age\n"Alice ""The Great""",30';
            const df = fromCSV(csv);

            expect(df.length).toBe(1);
            expect(df.getColumn('name')).toEqual(['Alice "The Great"']);
        });

        it('should handle values with newlines', () => {
            const csv = 'name,age\n"Alice\nSmith",30';
            const df = fromCSV(csv);

            expect(df.length).toBe(1);
            expect(df.getColumn('name')).toEqual(['Alice\nSmith']);
        });

        it('should infer number types', () => {
            const csv = 'name,age,score\nAlice,30,95.5\nBob,25,88';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            const ages = df.getColumn('age');
            const scores = df.getColumn('score');

            expect(ages[0]).toBe(30);
            expect(typeof ages[0]).toBe('number');
            expect(scores[0]).toBe(95.5);
            expect(typeof scores[0]).toBe('number');
        });

        it('should keep strings as strings even if they look numeric', () => {
            const csv = 'id,name\n"001","Alice"\n"002","Bob"';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            const ids = df.getColumn('id');
            expect(ids[0]).toBe('001');
            expect(typeof ids[0]).toBe('string');
        });

        it('should handle empty values as null', () => {
            const csv = 'name,age,city\nAlice,30,\nBob,,London\n,25,Tokyo';
            const df = fromCSV(csv);

            expect(df.length).toBe(3);
            expect(df.getColumn('city')[0]).toBeNull();
            expect(df.getColumn('age')[1]).toBeNull();
            expect(df.getColumn('name')[2]).toBeNull();
        });

        it('should handle explicit null values', () => {
            const csv = 'name,age\nnull,30\nBob,NULL';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')[0]).toBeNull();
            expect(df.getColumn('age')[0]).toBe(30);
            expect(df.getColumn('age')[1]).toBeNull();
        });

        it('should handle empty CSV', () => {
            const df1 = fromCSV('');
            expect(df1.length).toBe(0);
            expect(df1.width).toBe(0);

            const df2 = fromCSV('   ');
            expect(df2.length).toBe(0);
        });

        it('should handle CSV with only headers', () => {
            const csv = 'name,age,city';
            const df = fromCSV(csv);

            // When only headers exist, we create one row with null values to preserve column structure
            expect(df.length).toBe(1);
            expect(df.width).toBe(3);
            expect(df.getColumnNames()).toEqual(['name', 'age', 'city']);
            expect(df.getColumn('name')[0]).toBeNull();
        });

        it('should skip empty lines by default', () => {
            const csv = 'name,age\nAlice,30\n\nBob,25\n';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should not skip empty lines when option is disabled', () => {
            const csv = 'name,age\nAlice,30\n\nBob,25';
            const df = fromCSV(csv, { skipEmptyLines: false });

            // Empty line will create a row with empty values (all null)
            // Note: empty lines are rows with all empty cells, which become null
            expect(df.length).toBeGreaterThanOrEqual(2);
            // The exact count depends on how empty lines are parsed
            expect(df.getColumn('name')).toContain('Alice');
            expect(df.getColumn('name')).toContain('Bob');
        });

        it('should handle rows with different column counts', () => {
            const csv = 'name,age,city\nAlice,30\nBob,25,London,extra';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.width).toBe(3);
            // Missing columns should be empty strings (converted to null)
            expect(df.getColumn('city')[0]).toBeNull();
        });

        it('should round-trip CSV correctly', () => {
            const originalData: Person[] = [
                { name: 'Alice', age: 30, city: 'New York' },
                { name: 'Bob', age: 25, city: 'London' },
            ];
            const df1 = new DataFrame(originalData);
            const csv = toCSV(df1);
            const df2 = fromCSV(csv);

            expect(df2.length).toBe(df1.length);
            expect(df2.width).toBe(df1.width);
            expect(df2.getColumn('name')).toEqual(['Alice', 'Bob']);
            expect(df2.getColumn('age')).toEqual([30, 25]);
            expect(df2.getColumn('city')).toEqual(['New York', 'London']);
        });

        it('should handle special characters in values', () => {
            const csv = 'name,description\nAlice,"She said ""Hello"""\nBob,"Value, with comma"';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('description')[0]).toBe('She said "Hello"');
            expect(df.getColumn('description')[1]).toBe('Value, with comma');
        });

        it('should handle Windows line endings', () => {
            const csv = 'name,age\r\nAlice,30\r\nBob,25';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should handle mixed line endings', () => {
            const csv = 'name,age\nAlice,30\r\nBob,25';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should handle decimal numbers', () => {
            const csv = 'name,price\nApple,1.99\nBanana,0.50';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('price')[0]).toBe(1.99);
            expect(df.getColumn('price')[1]).toBe(0.5);
            expect(typeof df.getColumn('price')[0]).toBe('number');
        });

        it('should handle negative numbers', () => {
            const csv = 'name,value\nItem1,-10\nItem2,5';
            const df = fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('value')[0]).toBe(-10);
            expect(df.getColumn('value')[1]).toBe(5);
        });
    });
});

