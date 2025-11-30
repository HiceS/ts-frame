/**
 * Column validation functions for null and NaN detection
 */
import type { DataFrame } from '../core/DataFrame';

/**
 * Checks if a specific value is null or undefined
 */
function isNullish(value: unknown): boolean {
    return value === null || value === undefined;
}

/**
 * Checks if a specific value is NaN
 */
function isNaNValue(value: unknown): boolean {
    return typeof value === 'number' && Number.isNaN(value);
}

/**
 * Returns a boolean array indicating which values in a column are null or undefined
 * Similar to pandas isna() or isnull()
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function isNull<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): boolean[] {
    const columns = df.getColumnNames();
    if (!columns.includes(columnName)) {
        throw new Error(`Column "${String(columnName)}" does not exist`);
    }

    const data = df.getRows();
    return data.map((row) => isNullish(row[columnName]));
}

/**
 * Returns a boolean array indicating which values in a column are NaN
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function isNaN<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): boolean[] {
    const columns = df.getColumnNames();
    if (!columns.includes(columnName)) {
        throw new Error(`Column "${String(columnName)}" does not exist`);
    }

    const data = df.getRows();
    return data.map((row) => isNaNValue(row[columnName]));
}

/**
 * Returns a boolean array indicating which values in a column are NOT null or undefined
 * Similar to pandas notna() or notnull()
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function notNull<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): boolean[] {
    return isNull(df, columnName).map((val) => !val);
}

/**
 * Checks if a column has any null or undefined values
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function hasNull<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): boolean {
    return isNull(df, columnName).some((val) => val);
}

/**
 * Checks if a column has any NaN values
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function hasNaN<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): boolean {
    return isNaN(df, columnName).some((val) => val);
}

/**
 * Counts the number of null or undefined values in a column
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function countNull<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): number {
    return isNull(df, columnName).filter((val) => val).length;
}

/**
 * Counts the number of NaN values in a column
 * @param df The DataFrame to check
 * @param columnName The name of the column to check
 */
export function countNaN<T extends Record<string, any>>(
    df: DataFrame<T>,
    columnName: keyof T
): number {
    return isNaN(df, columnName).filter((val) => val).length;
}

