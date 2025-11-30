/**
 * DataFrame library for TypeScript
 * Similar to pandas, with query and serialization capabilities
 */

/**
 * A DataFrame represents a two-dimensional data structure with labeled columns
 */
export class DataFrame<T extends Record<string, any>> {
    private readonly data: readonly T[];
    private readonly columns: readonly (keyof T)[];

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

    /**
     * Checks if a column contains only numeric values (number type, not NaN)
     * @param columnName The name of the column to check
     */
    isNumeric<K extends keyof T>(columnName: K): boolean {
        if (!this.columns.includes(columnName)) {
            throw new Error(`Column "${String(columnName)}" does not exist`);
        }

        if (this.data.length === 0) {
            return false;
        }

        for (const row of this.data) {
            const value = row[columnName];
            if (value === null || value === undefined) {
                continue; // Skip null/undefined values
            }
            if (typeof value !== 'number' || Number.isNaN(value)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if a column contains only string values
     * @param columnName The name of the column to check
     */
    isString<K extends keyof T>(columnName: K): boolean {
        if (!this.columns.includes(columnName)) {
            throw new Error(`Column "${String(columnName)}" does not exist`);
        }

        if (this.data.length === 0) {
            return false;
        }

        for (const row of this.data) {
            const value = row[columnName];
            if (value === null || value === undefined) {
                continue; // Skip null/undefined values
            }
            if (typeof value !== 'string') {
                return false;
            }
        }
        return true;
    }

    /**
     * Gets the inferred type of a column
     * Returns 'number', 'string', 'mixed', or 'empty'
     * @param columnName The name of the column to check
     */
    getColumnType<K extends keyof T>(columnName: K): 'number' | 'string' | 'mixed' | 'empty' {
        if (!this.columns.includes(columnName)) {
            throw new Error(`Column "${String(columnName)}" does not exist`);
        }

        if (this.data.length === 0) {
            return 'empty';
        }

        const hasNumber = this.isNumeric(columnName);
        const hasString = this.isString(columnName);

        if (hasNumber && !hasString) {
            return 'number';
        }
        if (hasString && !hasNumber) {
            return 'string';
        }
        return 'mixed';
    }

    /**
     * Checks if a specific value is null or undefined
     * @param value The value to check
     */
    private isNullish(value: unknown): boolean {
        return value === null || value === undefined;
    }

    /**
     * Checks if a specific value is NaN
     * @param value The value to check
     */
    private isNaNValue(value: unknown): boolean {
        return typeof value === 'number' && Number.isNaN(value);
    }

    /**
     * Returns a boolean array indicating which values in a column are null or undefined
     * Similar to pandas isna() or isnull()
     * @param columnName The name of the column to check
     */
    isNull<K extends keyof T>(columnName: K): boolean[] {
        if (!this.columns.includes(columnName)) {
            throw new Error(`Column "${String(columnName)}" does not exist`);
        }

        return this.data.map((row) => this.isNullish(row[columnName]));
    }

    /**
     * Returns a boolean array indicating which values in a column are NaN
     * @param columnName The name of the column to check
     */
    isNaN<K extends keyof T>(columnName: K): boolean[] {
        if (!this.columns.includes(columnName)) {
            throw new Error(`Column "${String(columnName)}" does not exist`);
        }

        return this.data.map((row) => this.isNaNValue(row[columnName]));
    }

    /**
     * Returns a boolean array indicating which values in a column are NOT null or undefined
     * Similar to pandas notna() or notnull()
     * @param columnName The name of the column to check
     */
    notNull<K extends keyof T>(columnName: K): boolean[] {
        return this.isNull(columnName).map((val) => !val);
    }

    /**
     * Checks if a column has any null or undefined values
     * @param columnName The name of the column to check
     */
    hasNull<K extends keyof T>(columnName: K): boolean {
        return this.isNull(columnName).some((val) => val);
    }

    /**
     * Checks if a column has any NaN values
     * @param columnName The name of the column to check
     */
    hasNaN<K extends keyof T>(columnName: K): boolean {
        return this.isNaN(columnName).some((val) => val);
    }

    /**
     * Counts the number of null or undefined values in a column
     * @param columnName The name of the column to check
     */
    countNull<K extends keyof T>(columnName: K): number {
        return this.isNull(columnName).filter((val) => val).length;
    }

    /**
     * Counts the number of NaN values in a column
     * @param columnName The name of the column to check
     */
    countNaN<K extends keyof T>(columnName: K): number {
        return this.isNaN(columnName).filter((val) => val).length;
    }

    /**
     * Exports the DataFrame to CSV format
     * Numbers are exported without quotes (as per CSV standard)
     * @param options Optional configuration for CSV export
     */
    toCSV(options?: { delimiter?: string; includeHeaders?: boolean }): string {
        const delimiter = options?.delimiter ?? ',';
        const includeHeaders = options?.includeHeaders ?? true;

        if (this.data.length === 0) {
            // For empty DataFrame, we can't determine columns from data
            // Return empty string or just headers if we have column info
            if (this.columns.length > 0 && includeHeaders) {
                return this.columns.map((col) => this.escapeCSVValue(String(col), true)).join(delimiter);
            }
            return '';
        }

        const lines: string[] = [];

        // Add header row
        if (includeHeaders) {
            lines.push(this.columns.map((col) => this.escapeCSVValue(String(col), true)).join(delimiter));
        }

        // Add data rows
        for (const row of this.data) {
            const values = this.columns.map((col) => {
                const value = row[col];
                if (value === null || value === undefined) {
                    return '';
                }
                const isNumeric = typeof value === 'number' && !Number.isNaN(value);
                return this.escapeCSVValue(value, isNumeric);
            });
            lines.push(values.join(delimiter));
        }

        return lines.join('\n');
    }

    /**
     * Escapes a value for CSV format
     * Numbers are not quoted, strings are only quoted if they contain special characters
     * @param value The value to escape
     * @param isNumeric Whether the value is numeric (should not be quoted)
     */
    private escapeCSVValue(value: string | number, isNumeric: boolean = false): string {
        // Numbers should not be quoted - return as string representation
        if (isNumeric) {
            return String(value);
        }

        // Convert to string
        const strValue = String(value);

        // If value contains delimiter, quotes, or newlines, wrap in quotes and escape internal quotes
        if (
            strValue.includes(',') ||
            strValue.includes('"') ||
            strValue.includes('\n') ||
            strValue.includes('\r')
        ) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
    }

    /**
     * Creates a DataFrame from a CSV string
     * @param csvString The CSV string to parse
     * @param options Optional configuration for CSV parsing
     */
    static fromCSV(
        csvString: string,
        options?: {
            delimiter?: string;
            hasHeaders?: boolean;
            skipEmptyLines?: boolean;
        }
    ): DataFrame<Record<string, any>> {
        const delimiter = options?.delimiter ?? ',';
        const hasHeaders = options?.hasHeaders ?? true;
        const skipEmptyLines = options?.skipEmptyLines ?? true;

        if (!csvString || csvString.trim() === '') {
            return new DataFrame<Record<string, any>>([]);
        }

        // Parse CSV properly handling quoted fields that may contain newlines
        const rows = DataFrame.parseCSVRows(csvString, delimiter);

        // Filter empty lines if needed
        const filteredRows = skipEmptyLines
            ? rows.filter((row) => row.some((cell) => cell.trim() !== ''))
            : rows;

        if (filteredRows.length === 0) {
            return new DataFrame<Record<string, any>>([]);
        }

        // Parse header row if present
        let columnNames: string[] = [];
        let dataStartIndex = 0;

        if (hasHeaders && filteredRows.length > 0) {
            columnNames = filteredRows[0]!;
            dataStartIndex = 1;
        } else if (filteredRows.length > 0) {
            // If no headers, use first row to determine column count
            const firstRow = filteredRows[0]!;
            columnNames = firstRow.map((_, index) => `column${index + 1}`);
            dataStartIndex = 0;
        }

        if (columnNames.length === 0) {
            return new DataFrame<Record<string, any>>([]);
        }

        // Parse data rows
        const data: Record<string, any>[] = [];
        for (let i = dataStartIndex; i < filteredRows.length; i++) {
            const rowValues = filteredRows[i];
            if (!rowValues) continue;

            // Ensure row has same number of columns as headers (pad with empty strings if needed)
            const values = [...rowValues];
            while (values.length < columnNames.length) {
                values.push('');
            }

                const row: Record<string, any> = {};
                for (let j = 0; j < columnNames.length; j++) {
                    const columnName = columnNames[j]!;
                    let value = values[j] ?? '';

                    // Infer type: try to parse as number
                    const trimmedValue = value.trim();
                    if (trimmedValue === '' || trimmedValue === 'null' || trimmedValue === 'NULL') {
                        row[columnName] = null;
                    } else {
                        // Only try to parse as number if it looks like a pure number
                        // Check if it matches the pattern of a number (optional minus, digits, optional decimal)
                        // Exclude numbers with leading zeros (like "001") as they're likely meant to be strings
                        const numberPattern = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i;
                        const hasLeadingZeros = /^-?0+[1-9]/.test(trimmedValue);
                        
                        if (numberPattern.test(trimmedValue) && !hasLeadingZeros) {
                            const numValue = Number(trimmedValue);
                            if (!Number.isNaN(numValue) && isFinite(numValue)) {
                                row[columnName] = numValue;
                            } else {
                                row[columnName] = value;
                            }
                        } else {
                            // Not a number pattern or has leading zeros, keep as string
                            row[columnName] = value;
                        }
                    }
                }
            data.push(row);
        }

        // If we have headers but no data, create a DataFrame with one empty row to preserve column structure
        if (data.length === 0 && columnNames.length > 0) {
            const emptyRow: Record<string, any> = {};
            for (const col of columnNames) {
                emptyRow[col] = null;
            }
            return new DataFrame<Record<string, any>>([emptyRow]);
        }

        return new DataFrame<Record<string, any>>(data);
    }

    /**
     * Parses CSV string into rows, properly handling quoted fields with newlines
     * @param csvString The CSV string to parse
     * @param delimiter The delimiter character
     */
    private static parseCSVRows(csvString: string, delimiter: string): string[][] {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < csvString.length) {
            const char = csvString[i]!;
            const nextChar = i + 1 < csvString.length ? csvString[i + 1] : null;

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote inside quoted field
                    current += '"';
                    i += 2;
                } else if (inQuotes) {
                    // End of quoted field (quote followed by delimiter, newline, or end of string)
                    inQuotes = false;
                    i++; // Skip the closing quote
                } else {
                    // Start of quoted field
                    inQuotes = true;
                    i++; // Skip the opening quote
                }
            } else if (char === delimiter && !inQuotes) {
                // Field separator
                currentRow.push(current);
                current = '';
                i++;
            } else if ((char === '\n' || (char === '\r' && nextChar !== '\n')) && !inQuotes) {
                // Row separator (handle both \n and \r\n)
                currentRow.push(current);
                rows.push(currentRow);
                currentRow = [];
                current = '';
                if (char === '\r' && nextChar === '\n') {
                    i += 2; // Skip \r\n
                } else {
                    i++;
                }
            } else {
                current += char;
                i++;
            }
        }

        // Add the last field and row
        currentRow.push(current);
        if (currentRow.length > 0 || current !== '') {
            rows.push(currentRow);
        }

        return rows;
    }

}
