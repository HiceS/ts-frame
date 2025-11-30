# ts-frame [![npm](https://img.shields.io/npm/dm/ts-frame?style=flat&logo=npm)](https://www.npmjs.com/package/ts-frame)

A lightweight, type-safe DataFrame library for TypeScript, inspired by pandas. Perfect for data manipulation, analysis, and CSV I/O operations.

## Features

- **Type-safe** - Full TypeScript support with generic types
- **Tree-shakeable** - Import only what you need for smaller bundles
- **DataFrame operations** - Select columns, get data, and more
- **Column validation** - Check for nulls, NaNs, and column types
- **CSV I/O** - Import and export CSV files with proper type inference
- **Zero dependencies** - Lightweight and fast

## Installation

```bash
npm install ts-frame
```

## Quick Start

```typescript
import { DataFrame } from 'ts-frame';

// Create a DataFrame from an array of objects
const data = [
  { name: 'Alice', age: 30, city: 'New York' },
  { name: 'Bob', age: 25, city: 'London' },
  { name: 'Charlie', age: 35, city: 'Tokyo' },
];

const df = new DataFrame(data);

// Get basic info
console.log(df.length);  // 3
console.log(df.width);   // 3
console.log(df.getColumnNames()); // ['name', 'age', 'city']

// Select columns
const names = df.getColumn('name');
// ['Alice', 'Bob', 'Charlie']

// Select multiple columns
const subset = df.select('name', 'age');
```

## Basic Usage

### Creating DataFrames

```typescript
import { DataFrame } from 'ts-frame';

// From array of objects
const df = new DataFrame([
  { id: 1, name: 'Alice', score: 95 },
  { id: 2, name: 'Bob', score: 87 },
  { id: 3, name: 'Charlie', score: 92 },
]);

// Empty DataFrame
const empty = new DataFrame<{ a: number; b: string }>([]);
```

### Column Operations

```typescript
import { DataFrame } from 'ts-frame';

const df = new DataFrame(data);

// Get a single column
const ages = df.getColumn('age');
// [30, 25, 35]

// Select multiple columns (returns new DataFrame)
const selected = df.select('name', 'age');

// Get all rows
const rows = df.getRows();
```

### Type Checking

```typescript
import { DataFrame, isNumeric, isString, getColumnType } from 'ts-frame';

const df = new DataFrame(data);

// Check if column is numeric
if (isNumeric(df, 'age')) {
  console.log('Age column contains numbers');
}

// Check if column is string
if (isString(df, 'name')) {
  console.log('Name column contains strings');
}

// Get column type
const type = getColumnType(df, 'age');
// 'number' | 'string' | 'mixed' | 'empty'
```

### Null and NaN Detection

```typescript
import { DataFrame, isNull, hasNull, countNull, isNaN, hasNaN } from 'ts-frame';

const df = new DataFrame([
  { name: 'Alice', age: 30, score: 95 },
  { name: null, age: null, score: Number.NaN },
  { name: 'Bob', age: 25, score: 88 },
]);

// Check for null values
const nullMask = isNull(df, 'name');
// [false, true, false]

if (hasNull(df, 'name')) {
  console.log('Name column has null values');
}

const nullCount = countNull(df, 'name');
// 1

// Check for NaN values
if (hasNaN(df, 'score')) {
  console.log('Score column has NaN values');
}
```

### CSV Import and Export

```typescript
import { DataFrame, toCSV, fromCSV } from 'ts-frame';

// Export to CSV
const df = new DataFrame(data);
const csv = toCSV(df);
// name,age,city
// Alice,30,New York
// Bob,25,London

// Export with options
const csvNoHeaders = toCSV(df, { includeHeaders: false });
const csvCustomDelimiter = toCSV(df, { delimiter: ';' });

// Import from CSV
const csvString = `name,age,city
Alice,30,New York
Bob,25,London`;

const imported = fromCSV(csvString);
// Automatically infers types (numbers become numbers, not strings)

// Import with options
const importedNoHeaders = fromCSV(csvString, { hasHeaders: false });
const importedCustomDelimiter = fromCSV(csvString, { delimiter: ';' });
```

## Tree-Shaking Support

For smaller bundle sizes, you can import only what you need:

```typescript
// Import only the core DataFrame class
import { DataFrame } from 'ts-frame/core';

// Import only column operations
import { isNumeric, hasNull } from 'ts-frame/columns';

// Import only CSV operations
import { toCSV, fromCSV } from 'ts-frame/io';
```

This allows bundlers to eliminate unused code, resulting in smaller bundle sizes.

## API Reference

### DataFrame Class

#### Constructor
```typescript
new DataFrame<T>(data: readonly T[])
```

#### Properties
- `length: number` - Number of rows
- `width: number` - Number of columns

#### Methods
- `getColumnNames(): readonly (keyof T)[]` - Get all column names
- `getRows(): readonly T[]` - Get all rows
- `getColumn<K>(columnName: K): readonly T[K][]` - Get a specific column
- `select<K>(...columnNames: K[]): DataFrame<Pick<T, K>>` - Select columns

### Column Operations

#### Type Checking
- `isNumeric<T>(df: DataFrame<T>, columnName: keyof T): boolean`
- `isString<T>(df: DataFrame<T>, columnName: keyof T): boolean`
- `getColumnType<T>(df: DataFrame<T>, columnName: keyof T): 'number' | 'string' | 'mixed' | 'empty'`

#### Validation
- `isNull<T>(df: DataFrame<T>, columnName: keyof T): boolean[]`
- `isNaN<T>(df: DataFrame<T>, columnName: keyof T): boolean[]`
- `notNull<T>(df: DataFrame<T>, columnName: keyof T): boolean[]`
- `hasNull<T>(df: DataFrame<T>, columnName: keyof T): boolean`
- `hasNaN<T>(df: DataFrame<T>, columnName: keyof T): boolean`
- `countNull<T>(df: DataFrame<T>, columnName: keyof T): number`
- `countNaN<T>(df: DataFrame<T>, columnName: keyof T): number`

### I/O Operations

#### CSV Export
```typescript
toCSV<T>(df: DataFrame<T>, options?: {
  delimiter?: string;
  includeHeaders?: boolean;
}): string
```

#### CSV Import
```typescript
fromCSV(csvString: string, options?: {
  delimiter?: string;
  hasHeaders?: boolean;
  skipEmptyLines?: boolean;
}): DataFrame<Record<string, any>>
```

## Examples

### Working with Real Data

```typescript
import { DataFrame, isNumeric, hasNull, toCSV } from 'ts-frame';

interface SalesRecord {
  date: string;
  product: string;
  quantity: number;
  price: number;
  revenue: number | null;
}

const sales = new DataFrame<SalesRecord>([
  { date: '2024-01-01', product: 'Widget', quantity: 10, price: 5.99, revenue: 59.90 },
  { date: '2024-01-02', product: 'Gadget', quantity: 5, price: 12.99, revenue: 64.95 },
  { date: '2024-01-03', product: 'Widget', quantity: 8, price: 5.99, revenue: null },
]);

// Check data quality
if (hasNull(sales, 'revenue')) {
  console.log('Some sales have missing revenue data');
}

// Select relevant columns
const summary = sales.select('date', 'product', 'revenue');

// Export to CSV
const csv = toCSV(summary);
```

### Data Validation

```typescript
import { DataFrame, isNumeric, getColumnType, countNull } from 'ts-frame';

const df = new DataFrame(data);

// Validate column types
for (const col of df.getColumnNames()) {
  const type = getColumnType(df, col);
  console.log(`${String(col)}: ${type}`);
  
  if (type === 'number' && !isNumeric(df, col)) {
    console.warn(`Column ${String(col)} should be numeric but isn't`);
  }
  
  const nullCount = countNull(df, col);
  if (nullCount > 0) {
    console.warn(`Column ${String(col)} has ${nullCount} null values`);
  }
}
```

### CSV Round-Trip

```typescript
import { DataFrame, toCSV, fromCSV } from 'ts-frame';

// Create DataFrame
const original = new DataFrame([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
]);

// Export to CSV
const csv = toCSV(original);

// Import back
const imported = fromCSV(csv);

// Data is preserved with correct types
console.log(imported.getColumn('age')); // [30, 25] (numbers, not strings)
```

## Roadmap

The following features are planned but not yet implemented:

### Filtering and Querying
- [ ] `filter()` - Filter rows based on conditions
- [ ] `where()` - SQL-like WHERE clause
- [ ] `query()` - Query language support

### Aggregation
- [ ] `groupBy()` - Group rows by column values
- [ ] `sum()`, `mean()`, `min()`, `max()` - Aggregate functions
- [ ] `count()` - Count distinct values
- [ ] `aggregate()` - Custom aggregation

### Transformations
- [ ] `map()` - Transform rows
- [ ] `apply()` - Apply function to columns
- [ ] `sort()` - Sort by columns
- [ ] `drop()` - Drop columns or rows
- [ ] `rename()` - Rename columns

### Joins and Merges
- [ ] `join()` - Join multiple DataFrames
- [ ] `merge()` - Merge DataFrames
- [ ] `concat()` - Concatenate DataFrames

### Additional I/O
- [ ] JSON import/export
- [ ] Excel import/export
- [ ] Parquet support

### Data Operations
- [ ] `fillna()` - Fill null values
- [ ] `dropna()` - Drop null values
- [ ] `replace()` - Replace values
- [ ] `unique()` - Get unique values
- [ ] `valueCounts()` - Count value frequencies

### Performance
- [ ] Lazy evaluation
- [ ] Streaming support for large datasets
- [ ] Index support for faster lookups

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Related Projects

- [pandas](https://pandas.pydata.org/) - Python data analysis library (inspiration)
- [polars](https://www.pola.rs/) - Fast DataFrame library in Rust
