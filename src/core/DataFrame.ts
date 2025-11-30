/**
 * Core DataFrame class with essential operations
 */

/**
 * A DataFrame represents a two-dimensional data structure with labeled columns
 */
export class DataFrame<T extends Record<string, any>> {
    protected readonly data: readonly T[];
    protected readonly columns: readonly (keyof T)[];

    /**
     * Creates a new DataFrame from an array of objects
     * @param data Array of objects where each object represents a row
     */
    constructor(data: readonly T[]) {
        if (data.length === 0) {
            this.data = [];
            this.columns = [];
            return;
        }

        // Extract column names from the first row
        const firstRow = data[0];
        if (!firstRow || typeof firstRow !== 'object') {
            throw new Error('DataFrame data must be an array of objects');
        }

        this.columns = Object.keys(firstRow) as (keyof T)[];
        this.data = data;
    }

    /**
     * Returns the number of rows in the DataFrame
     */
    get length(): number {
        return this.data.length;
    }

    /**
     * Returns the number of columns in the DataFrame
     */
    get width(): number {
        return this.columns.length;
    }

    /**
     * Returns the column names
     */
    getColumnNames(): readonly (keyof T)[] {
        return this.columns;
    }

    /**
     * Returns all rows as an array
     */
    getRows(): readonly T[] {
        return this.data;
    }

    /**
     * Returns the data for a specific column
     * @param columnName The name of the column to retrieve
     */
    getColumn<K extends keyof T>(columnName: K): readonly T[K][] {
        return this.data.map((row) => row[columnName]);
    }

    /**
     * Selects specific columns and returns a new DataFrame
     * @param columnNames Array of column names to select
     */
    select<K extends keyof T>(...columnNames: K[]): DataFrame<Pick<T, K>> {
        if (columnNames.length === 0) {
            throw new Error('At least one column must be selected');
        }

        // Verify all columns exist
        for (const col of columnNames) {
            if (!this.columns.includes(col)) {
                throw new Error(`Column "${String(col)}" does not exist`);
            }
        }

        const selectedData = this.data.map((row) => {
            const selectedRow = {} as Pick<T, K>;
            for (const col of columnNames) {
                selectedRow[col] = row[col];
            }
            return selectedRow;
        });

        return new DataFrame<Pick<T, K>>(selectedData);
    }
}

