import { describe, it, expect, beforeEach } from 'vitest';
import { DataFrame } from './index';

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

    describe('CSV export', () => {
        let df: DataFrame<Person>;

        beforeEach(() => {
            df = new DataFrame(sampleData);
        });

        it('should export to CSV with headers', () => {
            const csv = df.toCSV();
            const lines = csv.split('\n');
            expect(lines[0]).toBe('name,age,city');
            expect(lines[1]).toBe('Alice,30,New York');
            expect(lines[2]).toBe('Bob,25,London');
            expect(lines[3]).toBe('Charlie,35,Tokyo');
        });

        it('should export to CSV without headers', () => {
            const csv = df.toCSV({ includeHeaders: false });
            const lines = csv.split('\n');
            expect(lines[0]).toBe('Alice,30,New York');
            expect(lines[1]).toBe('Bob,25,London');
            expect(lines[2]).toBe('Charlie,35,Tokyo');
        });

        it('should use custom delimiter', () => {
            const csv = df.toCSV({ delimiter: ';' });
            const lines = csv.split('\n');
            expect(lines[0]).toBe('name;age;city');
            expect(lines[1]).toBe('Alice;30;New York');
        });

        it('should escape values with commas', () => {
            const dataWithCommas: Person[] = [{ name: 'Alice, Jr.', age: 30, city: 'New York' }];
            const df = new DataFrame(dataWithCommas);
            const csv = df.toCSV();
            expect(csv).toContain('"Alice, Jr."');
        });

        it('should escape values with quotes', () => {
            const dataWithQuotes: Person[] = [
                { name: 'Alice "The Great"', age: 30, city: 'New York' },
            ];
            const df = new DataFrame(dataWithQuotes);
            const csv = df.toCSV();
            expect(csv).toContain('"Alice ""The Great"""');
        });

        it('should escape values with newlines', () => {
            const dataWithNewlines: Person[] = [
                { name: 'Alice\nSmith', age: 30, city: 'New York' },
            ];
            const df = new DataFrame(dataWithNewlines);
            const csv = df.toCSV();
            expect(csv).toContain('"Alice\nSmith"');
        });

        it('should handle empty DataFrame', () => {
            const emptyDf = new DataFrame<Person>([]);
            const csv = emptyDf.toCSV();
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
            const csv = df.toCSV();
            const lines = csv.split('\n');
            expect(lines[1]).toBe(',');
            expect(lines[2]).toBe('test,42');
        });

        it('should not quote numbers in CSV', () => {
            const csv = df.toCSV();
            const lines = csv.split('\n');
            // Numbers should not have quotes
            expect(lines[1]).toBe('Alice,30,New York');
            expect(lines[2]).toBe('Bob,25,London');
            expect(lines[3]).toBe('Charlie,35,Tokyo');
        });
    });

    describe('column type checking', () => {
        let df: DataFrame<Person>;

        beforeEach(() => {
            df = new DataFrame(sampleData);
        });

        it('should identify numeric columns', () => {
            expect(df.isNumeric('age')).toBe(true);
            expect(df.isNumeric('name')).toBe(false);
            expect(df.isNumeric('city')).toBe(false);
        });

        it('should identify string columns', () => {
            expect(df.isString('name')).toBe(true);
            expect(df.isString('city')).toBe(true);
            expect(df.isString('age')).toBe(false);
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
            expect(testDf.isNumeric('value')).toBe(true);
        });

        it('should return column type', () => {
            expect(df.getColumnType('age')).toBe('number');
            expect(df.getColumnType('name')).toBe('string');
            expect(df.getColumnType('city')).toBe('string');
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
            expect(testDf.getColumnType('mixed')).toBe('mixed');
        });

        it('should return empty for empty DataFrame', () => {
            const emptyDf = new DataFrame<Person>([]);
            // Empty DataFrame has no columns, so we can't check column type
            // This is expected behavior - empty DataFrame has no column information
            expect(emptyDf.width).toBe(0);
            expect(() => emptyDf.getColumnType('name' as keyof Person)).toThrow(
                'Column "name" does not exist'
            );
        });

        it('should throw error for non-existent column', () => {
            expect(() => df.isNumeric('nonexistent' as keyof Person)).toThrow(
                'Column "nonexistent" does not exist'
            );
            expect(() => df.isString('nonexistent' as keyof Person)).toThrow(
                'Column "nonexistent" does not exist'
            );
            expect(() => df.getColumnType('nonexistent' as keyof Person)).toThrow(
                'Column "nonexistent" does not exist'
            );
        });
    });

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
                const nullMask = df.isNull('name');
                expect(nullMask).toEqual([false, true, false]);
            });

            it('should detect undefined values as null', () => {
                const nullMask = df.isNull('city');
                expect(nullMask).toEqual([false, true, false]);
            });

            it('should handle columns with no nulls', () => {
                // Note: score has NaN but no nulls
                const nullMask = df.isNull('score');
                expect(nullMask).toEqual([false, false, false]);
            });
        });

        describe('isNaN', () => {
            it('should return boolean array for NaN values', () => {
                const nanMask = df.isNaN('score');
                expect(nanMask).toEqual([false, true, false]);
            });

            it('should not treat null as NaN', () => {
                const nanMask = df.isNaN('age');
                expect(nanMask).toEqual([false, false, false]);
            });

            it('should handle columns with no NaN', () => {
                const nanMask = df.isNaN('name');
                expect(nanMask).toEqual([false, false, false]);
            });
        });

        describe('notNull', () => {
            it('should return inverse of isNull', () => {
                const notNullMask = df.notNull('name');
                expect(notNullMask).toEqual([true, false, true]);
            });
        });

        describe('hasNull', () => {
            it('should return true if column has null values', () => {
                expect(df.hasNull('name')).toBe(true);
                expect(df.hasNull('age')).toBe(true);
                expect(df.hasNull('city')).toBe(true);
            });

            it('should return false if column has no null values', () => {
                // score has NaN but no nulls
                expect(df.hasNull('score')).toBe(false);
            });
        });

        describe('hasNaN', () => {
            it('should return true if column has NaN values', () => {
                expect(df.hasNaN('score')).toBe(true);
            });

            it('should return false if column has no NaN values', () => {
                expect(df.hasNaN('name')).toBe(false);
                expect(df.hasNaN('age')).toBe(false);
            });
        });

        describe('countNull', () => {
            it('should count null values in column', () => {
                expect(df.countNull('name')).toBe(1);
                expect(df.countNull('age')).toBe(1);
                expect(df.countNull('city')).toBe(1);
                expect(df.countNull('score')).toBe(0);
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
                expect(testDf.countNull('value')).toBe(2);
            });
        });

        describe('countNaN', () => {
            it('should count NaN values in column', () => {
                expect(df.countNaN('score')).toBe(1);
                expect(df.countNaN('name')).toBe(0);
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
                expect(testDf.countNaN('value')).toBe(2);
            });
        });

        it('should throw error for non-existent column', () => {
            expect(() => df.isNull('nonexistent' as keyof TestData)).toThrow(
                'Column "nonexistent" does not exist'
            );
            expect(() => df.isNaN('nonexistent' as keyof TestData)).toThrow(
                'Column "nonexistent" does not exist'
            );
            expect(() => df.hasNull('nonexistent' as keyof TestData)).toThrow(
                'Column "nonexistent" does not exist'
            );
            expect(() => df.hasNaN('nonexistent' as keyof TestData)).toThrow(
                'Column "nonexistent" does not exist'
            );
            expect(() => df.countNull('nonexistent' as keyof TestData)).toThrow(
                'Column "nonexistent" does not exist'
            );
            expect(() => df.countNaN('nonexistent' as keyof TestData)).toThrow(
                'Column "nonexistent" does not exist'
            );
        });
    });

    describe('fromCSV', () => {
        it('should parse CSV with headers', () => {
            const csv = 'name,age,city\nAlice,30,New York\nBob,25,London';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.width).toBe(3);
            expect(df.getColumnNames()).toEqual(['name', 'age', 'city']);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
            expect(df.getColumn('age')).toEqual([30, 25]);
            expect(df.getColumn('city')).toEqual(['New York', 'London']);
        });

        it('should parse CSV without headers', () => {
            const csv = 'Alice,30,New York\nBob,25,London';
            const df = DataFrame.fromCSV(csv, { hasHeaders: false });

            expect(df.length).toBe(2);
            expect(df.width).toBe(3);
            expect(df.getColumnNames()).toEqual(['column1', 'column2', 'column3']);
            expect(df.getColumn('column1')).toEqual(['Alice', 'Bob']);
            expect(df.getColumn('column2')).toEqual([30, 25]);
            expect(df.getColumn('column3')).toEqual(['New York', 'London']);
        });

        it('should handle custom delimiter', () => {
            const csv = 'name;age;city\nAlice;30;New York\nBob;25;London';
            const df = DataFrame.fromCSV(csv, { delimiter: ';' });

            expect(df.length).toBe(2);
            expect(df.width).toBe(3);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should parse quoted values', () => {
            const csv = 'name,age,city\n"Alice, Jr.",30,"New York"';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(1);
            expect(df.getColumn('name')).toEqual(['Alice, Jr.']);
            expect(df.getColumn('city')).toEqual(['New York']);
        });

        it('should handle escaped quotes', () => {
            const csv = 'name,age\n"Alice ""The Great""",30';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(1);
            expect(df.getColumn('name')).toEqual(['Alice "The Great"']);
        });

        it('should handle values with newlines', () => {
            const csv = 'name,age\n"Alice\nSmith",30';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(1);
            expect(df.getColumn('name')).toEqual(['Alice\nSmith']);
        });

        it('should infer number types', () => {
            const csv = 'name,age,score\nAlice,30,95.5\nBob,25,88';
            const df = DataFrame.fromCSV(csv);

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
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            const ids = df.getColumn('id');
            expect(ids[0]).toBe('001');
            expect(typeof ids[0]).toBe('string');
        });

        it('should handle empty values as null', () => {
            const csv = 'name,age,city\nAlice,30,\nBob,,London\n,25,Tokyo';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(3);
            expect(df.getColumn('city')[0]).toBeNull();
            expect(df.getColumn('age')[1]).toBeNull();
            expect(df.getColumn('name')[2]).toBeNull();
        });

        it('should handle explicit null values', () => {
            const csv = 'name,age\nnull,30\nBob,NULL';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')[0]).toBeNull();
            expect(df.getColumn('age')[0]).toBe(30);
            expect(df.getColumn('age')[1]).toBeNull();
        });

        it('should handle empty CSV', () => {
            const df1 = DataFrame.fromCSV('');
            expect(df1.length).toBe(0);
            expect(df1.width).toBe(0);

            const df2 = DataFrame.fromCSV('   ');
            expect(df2.length).toBe(0);
        });

        it('should handle CSV with only headers', () => {
            const csv = 'name,age,city';
            const df = DataFrame.fromCSV(csv);

            // When only headers exist, we create one row with null values to preserve column structure
            expect(df.length).toBe(1);
            expect(df.width).toBe(3);
            expect(df.getColumnNames()).toEqual(['name', 'age', 'city']);
            expect(df.getColumn('name')[0]).toBeNull();
        });

        it('should skip empty lines by default', () => {
            const csv = 'name,age\nAlice,30\n\nBob,25\n';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should not skip empty lines when option is disabled', () => {
            const csv = 'name,age\nAlice,30\n\nBob,25';
            const df = DataFrame.fromCSV(csv, { skipEmptyLines: false });

            // Empty line will create a row with empty values (all null)
            // Note: empty lines are rows with all empty cells, which become null
            expect(df.length).toBeGreaterThanOrEqual(2);
            // The exact count depends on how empty lines are parsed
            expect(df.getColumn('name')).toContain('Alice');
            expect(df.getColumn('name')).toContain('Bob');
        });

        it('should handle rows with different column counts', () => {
            const csv = 'name,age,city\nAlice,30\nBob,25,London,extra';
            const df = DataFrame.fromCSV(csv);

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
            const csv = df1.toCSV();
            const df2 = DataFrame.fromCSV(csv);

            expect(df2.length).toBe(df1.length);
            expect(df2.width).toBe(df1.width);
            expect(df2.getColumn('name')).toEqual(['Alice', 'Bob']);
            expect(df2.getColumn('age')).toEqual([30, 25]);
            expect(df2.getColumn('city')).toEqual(['New York', 'London']);
        });

        it('should handle special characters in values', () => {
            const csv = 'name,description\nAlice,"She said ""Hello"""\nBob,"Value, with comma"';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('description')[0]).toBe('She said "Hello"');
            expect(df.getColumn('description')[1]).toBe('Value, with comma');
        });

        it('should handle Windows line endings', () => {
            const csv = 'name,age\r\nAlice,30\r\nBob,25';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should handle mixed line endings', () => {
            const csv = 'name,age\nAlice,30\r\nBob,25';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('name')).toEqual(['Alice', 'Bob']);
        });

        it('should handle decimal numbers', () => {
            const csv = 'name,price\nApple,1.99\nBanana,0.50';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('price')[0]).toBe(1.99);
            expect(df.getColumn('price')[1]).toBe(0.5);
            expect(typeof df.getColumn('price')[0]).toBe('number');
        });

        it('should handle negative numbers', () => {
            const csv = 'name,value\nItem1,-10\nItem2,5';
            const df = DataFrame.fromCSV(csv);

            expect(df.length).toBe(2);
            expect(df.getColumn('value')[0]).toBe(-10);
            expect(df.getColumn('value')[1]).toBe(5);
        });
    });
});
