/**
 * Column type checking functions
 */
import type { DataFrame } from '../core/DataFrame';

/**
 * Checks if a column contains only numeric values (number type, not NaN)
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function isNumeric<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): boolean {
    const columns = df.getColumnNames();
    if (!columns.includes(columnName)) {
        throw new Error(`Column "${String(columnName)}" does not exist`);
    }

    const data = df.getRows();
    if (data.length === 0) {
        return false;
    }

    for (const row of data) {
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
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function isString<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): boolean {
    const columns = df.getColumnNames();
    if (!columns.includes(columnName)) {
        throw new Error(`Column "${String(columnName)}" does not exist`);
    }

    const data = df.getRows();
    if (data.length === 0) {
        return false;
    }

    for (const row of data) {
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
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function getColumnType<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): 'number' | 'string' | 'mixed' | 'empty' {
    const columns = df.getColumnNames();
    if (!columns.includes(columnName)) {
        throw new Error(`Column "${String(columnName)}" does not exist`);
    }

    const data = df.getRows();
    if (data.length === 0) {
        return 'empty';
    }

    const hasNumber = isNumeric(df, columnName);
    const hasString = isString(df, columnName);

    if (hasNumber && !hasString) {
        return 'number';
    }
    if (hasString && !hasNumber) {
        return 'string';
    }
    return 'mixed';
}

