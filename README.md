# @jhel/iterup

A TypeScript async iterator utility library that provides lazy evaluation for efficient data processing. All operations are asynchronous by design, supporting both synchronous and asynchronous data sources and transformation functions. Operations like `map`, `filter`, and `filterMap` don't consume values or create intermediate arrays until you call a consuming method like `collect()` or `toArray()`.

This makes it significantly more performant than chaining multiple `.map()`, `.filter()` operations on arrays directly, especially for large datasets, async operations, or when only partial consumption is needed.

## Features

- 🚀 **Lazy evaluation** - Operations are deferred until consumption
- ⚡ **Async-first design** - All operations support async/await patterns
- 🔄 **Mixed sync/async support** - Works with sync arrays, async generators, and mixed transformation functions
- 🔗 **Chainable API** - Fluent interface for readable code
- 📦 **TypeScript first** - Full type safety with excellent IntelliSense
- 🎯 **Memory efficient** - No intermediate arrays until you need them
- 🛠️ **Rust-inspired** - Familiar Option type and iterator patterns

## Installation

```bash
bun add @jhel/iterup
# or
npm install @jhel/iterup
```

## Quick Start

```ts
import { iterup, None } from '@jhel/iterup'

// Process an array
const numbers = await iterup([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .filterMap(n => n % 2 === 0 ? n : None)        // Keep only even numbers
  .map(n => n * 2)                               // Double them
  .drop(1)                                       // Skip first result
  .take(2)                                       // Take next 2
  .collect();                                    // Materialize the result

console.log(numbers); // [8, 12]

// Or generate and process a range
const rangeResult = await iterup({ from: 1, to: 11 })
  .filterMap(n => n % 2 === 0 ? n : None)        // Keep only even numbers  
  .map(n => n * 2)                               // Double them
  .drop(1)                                       // Skip first result
  .take(2)                                       // Take next 2
  .collect();                                    // Materialize the result

console.log(rangeResult); // [8, 12]
```

## API Reference

> **Note:** All Iterup instances are async iterators. Methods like `collect()`, `toArray()`, and `findMap()` return Promises and should be awaited.

### Creating Iterup Instances

#### `iterup(collection)` / `iterup(range)`

Creates an Iterup instance from any iterable, sync iterator, async iterator, or range configuration. The result is always an async iterator for consistent API design.

**Overloads:**
- `iterup(collection)` - Wraps any iterable or iterator
- `iterup(range)` - Creates a numeric range iterator

```ts
import { iterup } from '@jhel/iterup'

// From array
const numbers = iterup([1, 2, 3, 4, 5]);
const result = await numbers.collect(); // [1, 2, 3, 4, 5]

// From range (new overload)
const range1 = iterup({ from: 0, to: 5 });
const rangeResult = await range1.collect(); // [0, 1, 2, 3, 4]

// Inclusive range
const range2 = iterup({ from: 1, to: 3, inclusive: true });
const inclusiveResult = await range2.collect(); // [1, 2, 3]

// From set
const uniqueNumbers = iterup(new Set([1, 2, 2, 3]));

// From string
const chars = iterup("hello");

// From sync generator
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
const fibNumbers = iterup(fibonacci());

// From async generator
async function* asyncNumbers() {
  for (let i = 1; i <= 5; i++) {
    yield await Promise.resolve(i);
  }
}
const asyncNums = iterup(asyncNumbers());
```

### Direct Function Usage

You can also use the utility functions directly without creating an Iterup instance:

```ts
import { filterMap, findMap, enumerate, collect, map, take, drop, range, sum, None } from '@jhel/iterup'

const data = [1, 2, 3, 4, 5];

// Filter and map in one operation
const result = await collect(filterMap(data, (n) => n % 2 === 0 ? n * 2 : None));
console.log(result); // [4, 8]

// Find and map the first match
const firstEven = await findMap(data, (n) => n % 2 === 0 ? `Even: ${n}` : None);
console.log(firstEven); // "Even: 2"

// Generate numeric ranges
const numbers = await collect(range({ from: 0, to: 5 }));
console.log(numbers); // [0, 1, 2, 3, 4]

// Inclusive range
const inclusive = await collect(range({ from: 1, to: 3, inclusive: true }));
console.log(inclusive); // [1, 2, 3]

// Infinite range (be careful with collect()!)
const infinite = range({ from: 10 });
const first5 = await collect(take(infinite, 5));
console.log(first5); // [10, 11, 12, 13, 14]

// Chain multiple operations
const processed = await collect(
  take(
    map(
      drop(data, 1), 
      x => x * 2
    ), 
    2
  )
);
console.log(processed); // [4, 6] (dropped first, doubled, took 2)

// Calculate sum directly
const total = await sum([1, 2, 3, 4, 5]);
console.log(total); // 15

// Combine with other operations
const evenSum = await sum(filterMap(data, (n) => n % 2 === 0 ? n : None));
console.log(evenSum); // 12 (sum of even numbers: 2 + 4)
```

### Core Methods

#### `.map(fn)`

Transforms each element using the provided function. Supports both sync and async transformation functions.

```ts
// Sync transformation
const doubled = await iterup([1, 2, 3])
  .map(n => n * 2)
  .collect(); // [2, 4, 6]

// Async transformation
const asyncDoubled = await iterup([1, 2, 3])
  .map(async n => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return n * 2;
  })
  .collect(); // [2, 4, 6]

// With index
const indexed = await iterup(['a', 'b', 'c'])
  .map((value, index) => `${index}: ${value}`)
  .collect(); // ['0: a', '1: b', '2: c']
```

#### `.flatMap(fn)`

Maps each element to an iterable and flattens the results. Supports async transformation functions.

```ts
// Flatten arrays
const flattened = await iterup([1, 2, 3])
  .flatMap(x => [x, x * 10])
  .collect(); // [1, 10, 2, 20, 3, 30]

// Split strings
const chars = await iterup(['hello', 'world'])
  .flatMap(word => word.split(''))
  .collect(); // ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']

// Async transformation
const asyncFlattened = await iterup([1, 2])
  .flatMap(async x => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return [x, x + 10];
  })
  .collect(); // [1, 11, 2, 12]
```

### Utility Functions

#### `range(options)`

Creates an iterator that yields a sequence of numbers within a specified range. Provides a convenient way to generate numeric sequences without pre-allocating arrays.

**Parameters:**
- `options.from` - Starting number (inclusive)
- `options.to` - Ending number (exclusive by default, defaults to `Number.MAX_SAFE_INTEGER`)
- `options.inclusive` - Whether to include the 'to' value (default: `false`)

```ts
import { range } from '@jhel/iterup'

// Basic range from 0 to 4 (exclusive)
const basic = await range({ from: 0, to: 5 }).collect();
console.log(basic); // [0, 1, 2, 3, 4]

// Inclusive range
const inclusive = await range({ from: 1, to: 3, inclusive: true }).collect();
console.log(inclusive); // [1, 2, 3]

// Infinite range (be careful with collect()!)
const infinite = range({ from: 10 }); // 10, 11, 12, ...
const first5 = await infinite.take(5).collect();
console.log(first5); // [10, 11, 12, 13, 14]

// Used with iterup() overload
const shorthand = await iterup({ from: 0, to: 3 }).collect();
console.log(shorthand); // [0, 1, 2]

// Combine with other operations
const evenSquares = await range({ from: 0, to: 10 })
  .filterMap(n => n % 2 === 0 ? n * n : None)
  .collect();
console.log(evenSquares); // [0, 4, 16, 36, 64]

// Process in chunks
const processInBatches = async () => {
  const batchSize = 100;
  let processed = 0;
  
  for (let start = 0; start < 1000; start += batchSize) {
    const batch = await range({ 
      from: start, 
      to: start + batchSize 
    }).collect();
    
    processed += await processBatch(batch);
  }
  
  return processed;
};
```

### Extension Methods

#### `.filterMap(fn)`

Combines filtering and mapping in a single efficient operation. Return `None` to filter out elements, or a value to transform and include them. Supports async transformation functions.

```ts
// Basic filter and map
const numbers = await iterup([1, 2, 3, 4, 5, 6])
  .filterMap(n => {
    if (n % 2 === 0) return `Even: ${n}`;
    return None; // Filter out odd numbers
  })
  .collect(); // ["Even: 2", "Even: 4", "Even: 6"]

// Async transformation
const asyncFiltered = await iterup([1, 2, 3, 4])
  .filterMap(async n => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return n > 2 ? n * 2 : None;
  })
  .collect(); // [6, 8]
```

#### `.findMap(fn)`

Finds the first element that matches the predicate and maps it. Consumes the iterator until a match is found. Supports async transformation functions.

```ts
// Find first even number
const firstEven = await iterup([1, 3, 5, 2, 4])
  .findMap(n => n % 2 === 0 ? `First even: ${n}` : None);
console.log(firstEven); // "First even: 2"

// Async transformation
const asyncFound = await iterup([1, 2, 3])
  .findMap(async n => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return n > 1 ? `Found: ${n}` : None;
  });
console.log(asyncFound); // "Found: 2"
```

#### `.enumerate()`

Creates an iterator that yields `[value, index]` tuples, similar to Python's `enumerate()`.

```ts
const letters = await iterup(['a', 'b', 'c'])
  .enumerate()
  .collect(); // [['a', 0], ['b', 1], ['c', 2]]

// Useful for indexed operations
const indexed = await iterup(['apple', 'banana', 'cherry'])
  .enumerate()
  .map(([fruit, i]) => `${i + 1}. ${fruit}`)
  .collect(); // ["1. apple", "2. banana", "3. cherry"]
```

#### `.take(count)`

Takes the first `count` elements from the iterator.

```ts
const first3 = await iterup([1, 2, 3, 4, 5])
  .take(3)
  .collect(); // [1, 2, 3]

// Useful for limiting results
const limitedResults = await iterup(largeDataset)
  .map(expensiveOperation)
  .take(10)  // Only process first 10 items
  .collect();
```

#### `.drop(count)`

Skips the first `count` elements from the iterator.

```ts
const without2 = await iterup([1, 2, 3, 4, 5])
  .drop(2)
  .collect(); // [3, 4, 5]

// Skip header rows
const dataRows = await iterup(csvLines)
  .drop(1)  // Skip header
  .map(parseCsvLine)
  .collect();
```

#### `.collect()` / `.toArray()`

Materializes all values from the iterator into an array. This consumes the iterator and returns a Promise.

```ts
const result = await iterup([1, 2, 3])
  .map(n => n * 2)
  .collect(); // [2, 4, 6]

// .toArray() is an alias for .collect()
const same = await iterup([1, 2, 3])
  .map(n => n * 2)
  .toArray(); // [2, 4, 6]
```

#### `.sum()` (Numeric Only)

Calculates the sum of all numeric values in the iterator. This method is only available for Iterup instances that contain numbers and consumes the entire iterator.

```ts
// Sum an array of numbers
const total = await iterup([1, 2, 3, 4, 5]).sum();
console.log(total); // 15

// Sum after filtering and mapping
const evenSum = await iterup([1, 2, 3, 4, 5, 6])
  .filterMap(n => n % 2 === 0 ? n : None)
  .sum();
console.log(evenSum); // 12 (2 + 4 + 6)

// Sum a range
const rangeSum = await iterup({ from: 1, to: 6 }).sum();
console.log(rangeSum); // 15 (1 + 2 + 3 + 4 + 5)

// Sum with transformations
const squaredSum = await iterup([1, 2, 3])
  .map(n => n * n)
  .sum();
console.log(squaredSum); // 14 (1² + 2² + 3²)

// Only works with numeric iterators
// iterup(['a', 'b', 'c']).sum(); // TypeScript error - not numeric
```

### The Option Type

The `Option<T>` type represents a value that can either be present (`T`) or absent (`None`). It's used in methods like `filterMap` and `findMap` to indicate whether a value should be included in the result.

```ts
import { None, type Option } from '@jhel/iterup'

function processNumber(n: number): Option<string> {
  if (n > 0) return `Positive: ${n}`;
  if (n < 0) return `Negative: ${n}`;
  return None; // Filter out zero
}

const results = await iterup([-2, -1, 0, 1, 2])
  .filterMap(processNumber)
  .collect();
// ["Negative: -2", "Negative: -1", "Positive: 1", "Positive: 2"]
```

## Advanced Examples

### Processing Large Datasets with Async Operations

```ts
// Efficiently process large datasets with async operations
const processLargeDataset = async (data: number[]) => {
  return await iterup(data)
    .filterMap(async n => {
      if (n <= 0) return None;
      // Simulate async API call
      const result = await fetch(`/api/process/${n}`);
      return result.ok ? await result.text() : None;
    })
    .take(10)                                    // Limit to first 10 successful results
    .enumerate()                                 // Add indices
    .map(([value, i]) => `${i}: ${value}`)      // Format with index
    .collect();
};
```

### Working with Async Data Sources

```ts
// Reading from async sources like streams or APIs
async function* fetchPages() {
  let page = 1;
  while (page <= 5) {
    const response = await fetch(`/api/data?page=${page}`);
    const data = await response.json();
    for (const item of data.items) {
      yield item;
    }
    page++;
  }
}

const processedData = await iterup(fetchPages())
  .filterMap(async item => {
    // Validate and transform each item
    if (!item.valid) return None;
    return await processItem(item);
  })
  .collect();
```

### Generating Data with Ranges

```ts
// Process numeric sequences without creating large arrays
const processSequence = async () => {
  // Generate and process a large range efficiently
  const result = await iterup({ from: 0, to: 1000000 })
    .filterMap(n => n % 1000 === 0 ? n : None)    // Only process every 1000th number
    .map(async n => {
      // Simulate async processing
      const response = await fetch(`/api/checkpoint/${n}`);
      return { checkpoint: n, status: response.status };
    })
    .take(10)                                      // Only need first 10 checkpoints
    .collect();
  
  return result; // Memory efficient - never created a million-element array
};

// Batch processing with ranges
const processBatches = async (totalItems: number, batchSize: number) => {
  const results = [];
  
  // Process data in batches using ranges
  for (let start = 0; start < totalItems; start += batchSize) {
    const batch = await iterup({ from: start, to: start + batchSize })
      .map(async id => await fetchItem(id))
      .filterMap(item => item.isValid ? item : None)
      .collect();
    
    results.push(...batch);
    
    // Optional: Add delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

// Infinite sequences with controlled consumption
const infiniteProcessor = async () => {
  // Generate infinite sequence but only process what we need
  const processor = iterup({ from: 1 })  // 1, 2, 3, 4, ...
    .filterMap(async n => {
      const data = await fetchData(n);
      return data.isComplete ? data : None;
    });
  
  // Consume until we have enough results
  const results = [];
  for await (const item of processor) {
    results.push(item);
    if (results.length >= 5) break;  // Stop when we have enough
  }
  
  return results;
};
```

### Mixed Sync/Async Transformations

```ts
interface User {
  id: number;
  name: string;
  email?: string;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie", email: "charlie@example.com" },
];

// Mix sync and async operations
const enrichedUsers = await iterup(users)
  .filterMap(user => user.email ? user : None)          // Sync: filter users with email
  .map(async user => {                                  // Async: enrich with profile data
    const profile = await fetchUserProfile(user.id);
    return { ...user, profile };
  })
  .filterMap(async enrichedUser => {                    // Async: validate and format
    const isValid = await validateUser(enrichedUser);
    return isValid ? formatUser(enrichedUser) : None;
  })
  .collect();

// Calculate metrics on numeric data
const scores = [85, 92, 78, 96, 88, 91];
const totalScore = await iterup(scores).sum();
const highScoresSum = await iterup(scores)
  .filterMap(score => score >= 90 ? score : None)
  .sum(); // Sum only scores >= 90
```

### Lazy Evaluation Benefits

```ts
// The power of lazy evaluation with async operations
const processOnlyNeeded = async () => {
  let apiCallCount = 0;
  
  const result = await iterup([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .map(async n => {
      apiCallCount++;
      // Expensive async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      return await fetch(`/api/process/${n}`).then(r => r.json());
    })
    .filterMap(data => data.valid ? data.result : None)
    .take(3)  // Only need first 3 valid results
    .collect();

  // Due to lazy evaluation + take(3), API is called only as needed
  console.log(`API calls made: ${apiCallCount}`); // Likely 3-5, not 10
  return result;
};
```

### Performance Comparison

```ts
// Traditional approach - creates intermediate arrays and blocks on each operation
const traditionalApproach = async (data: number[]) => {
  const step1 = await Promise.all(data.map(async n => {
    return await expensiveAsyncOperation(n);  // All operations run at once
  }));
  
  const step2 = step1.filter(n => n > 10);   // Creates intermediate array
  const step3 = step2.map(n => n * 2);       // Creates another intermediate array
  return step3.slice(0, 5);                  // Finally take what we need
};

// Iterup approach - lazy evaluation with controlled concurrency
const iterupApproach = async (data: number[]) => {
  return await iterup(data)
    .map(async n => await expensiveAsyncOperation(n))  // Processed one by one
    .filterMap(n => n > 10 ? n * 2 : None)             // No intermediate arrays
    .take(5)                                           // Stop early when we have enough
    .collect();                                        // Single array creation
};
```

## Error Handling

```ts
// Handle errors in async transformations
const safeProcess = await iterup([1, 2, 3, 4, 5])
  .filterMap(async n => {
    try {
      const result = await riskyAsyncOperation(n);
      return result;
    } catch (error) {
      console.warn(`Failed to process ${n}:`, error);
      return None; // Filter out failed operations
    }
  })
  .collect();

// Or use a helper for error handling
const withErrorHandling = <T, R>(
  fn: (value: T, index: number) => Promise<R>
) => async (value: T, index: number): Promise<Option<R>> => {
  try {
    return await fn(value, index);
  } catch {
    return None;
  }
};

const safeResults = await iterup(data)
  .filterMap(withErrorHandling(async n => await riskyOperation(n)))
  .collect();
```

## Type Safety

Iterup is built with TypeScript-first design, providing excellent type inference and safety:

```ts
const numbers = iterup([1, 2, 3, 4, 5]);
// Type: Iterup<number>

const strings = numbers.map(n => n.toString());
// Type: Iterup<string>

const filtered = numbers.filterMap(n => n > 3 ? `Big: ${n}` : None);
// Type: Iterup<string>

// Async transformations are properly typed
const asyncResults = numbers.map(async n => {
  const result = await someAsyncOperation(n);
  return result; // TypeScript knows this is Promise<SomeType>
});
// Type: Iterup<SomeType>

const collected = await asyncResults.collect();
// Type: SomeType[]
```

## Development

To install dependencies:

```bash
bun install
```

Run tests:
```bash
bun test
```

Build for npm:
```bash
bun run build
```

## License

MIT License - see LICENSE file for details.
