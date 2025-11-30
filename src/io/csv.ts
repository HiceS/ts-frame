/**
 * CSV import and export operations
 */
import { DataFrame } from '../core/DataFrame';

/**
 * CSV export options
 */
export interface CSVExportOptions {
    delimiter?: string;
    includeHeaders?: boolean;
}

/**
 * CSV import options
 */
export interface CSVImportOptions {
    delimiter?: string;
    hasHeaders?: boolean;
    skipEmptyLines?: boolean;
}

/**
 * Escapes a value for CSV format
 * Numbers are not quoted, strings are only quoted if they contain special characters
 */
function escapeCSVValue(value: string | number, isNumeric: boolean = false): string {
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
 * Parses CSV string into rows, properly handling quoted fields with newlines
 */
function parseCSVRows(csvString: string, delimiter: string): string[][] {
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

/**
 * Exports a DataFrame to CSV format
 * Numbers are exported without quotes (as per CSV standard)
 * @param df The DataFrame to export
 * @param options Optional configuration for CSV export
 */
export function toCSV<T extends Record<string, any>>(
    df: DataFrame<T>,
    options?: CSVExportOptions
): string {
    const delimiter = options?.delimiter ?? ',';
    const includeHeaders = options?.includeHeaders ?? true;

    const data = df.getRows();
    const columns = df.getColumnNames();

    if (data.length === 0) {
        // For empty DataFrame, we can't determine columns from data
        // Return empty string or just headers if we have column info
        if (columns.length > 0 && includeHeaders) {
            return columns.map((col) => escapeCSVValue(String(col), true)).join(delimiter);
        }
        return '';
    }

    const lines: string[] = [];

    // Add header row
    if (includeHeaders) {
        lines.push(columns.map((col) => escapeCSVValue(String(col), true)).join(delimiter));
    }

    // Add data rows
    for (const row of data) {
        const values = columns.map((col) => {
            const value = row[col];
            if (value === null || value === undefined) {
                return '';
            }
            const isNumeric = typeof value === 'number' && !Number.isNaN(value);
            return escapeCSVValue(value, isNumeric);
        });
        lines.push(values.join(delimiter));
    }

    return lines.join('\n');
}

/**
 * Creates a DataFrame from a CSV string
 * @param csvString The CSV string to parse
 * @param options Optional configuration for CSV parsing
 */
export function fromCSV(csvString: string, options?: CSVImportOptions): DataFrame<Record<string, any>> {
    const delimiter = options?.delimiter ?? ',';
    const hasHeaders = options?.hasHeaders ?? true;
    const skipEmptyLines = options?.skipEmptyLines ?? true;

    if (!csvString || csvString.trim() === '') {
        return new DataFrame<Record<string, any>>([]);
    }

    // Parse CSV properly handling quoted fields that may contain newlines
    const rows = parseCSVRows(csvString, delimiter);

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

