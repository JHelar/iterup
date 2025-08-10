# @jhel/iterup

A TypeScript async iterator utility library with lazy evaluation for efficient data processing. All operations are asynchronous, supporting both sync and async data sources and transformations. Operations like `map`, `filter`, and `filterMap` don't consume values until you call `collect()` or `toArray()`.

## Features

- 🚀 **Lazy evaluation** - Operations deferred until consumption
- ⚡ **Async-first design** - All operations support async/await
- 🔄 **Mixed sync/async support** - Works with arrays, generators, and async functions
- 🔗 **Chainable API** - Fluent interface for readable code
- 📦 **TypeScript first** - Full type safety with excellent IntelliSense
- 🎯 **Memory efficient** - No intermediate arrays until needed

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

// Generate and process a range
const rangeResult = await iterup({ from: 1, to: 10 })
  .filterMap(n => n % 2 === 0 ? n : None)
  .map(n => n * 2)
  .take(2)
  .collect();

console.log(rangeResult); // [4, 8]
```

## API Reference

> **Note:** All Iterup instances are async iterators. Methods like `collect()`, `toArray()`, and `findMap()` return Promises and should be awaited.

### Creating Iterup Instances

#### `iterup(collection)` / `iterup(range)`

Creates an Iterup instance from any iterable, iterator, or range configuration.

**Overloads:**
- `iterup(collection)` - Wraps any iterable or iterator
- `iterup(range)` - Creates a numeric range iterator

```ts
import { iterup } from '@jhel/iterup'

// From array
const numbers = iterup([1, 2, 3, 4, 5]);
const result = await numbers.collect(); // [1, 2, 3, 4, 5]

// From range
const range1 = iterup({ from: 0, to: 5 });
const rangeResult = await range1.collect(); // [0, 1, 2, 3, 4, 5]

// From generators
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
const fibNumbers = iterup(fibonacci());
```

### Direct Function Usage

You can also use the utility functions directly without creating an Iterup instance:

```ts
import { filterMap, findMap, collect, map, range, sum, None } from '@jhel/iterup'

const data = [1, 2, 3, 4, 5];

// Filter and map in one operation
const result = await collect(filterMap(data, (n) => n % 2 === 0 ? n * 2 : None));
console.log(result); // [4, 8]

// Generate numeric ranges
const numbers = await collect(range({ from: 0, to: 5 }));
console.log(numbers); // [0, 1, 2, 3, 4, 5]

// Calculate sum directly
const total = await sum([1, 2, 3, 4, 5]);
console.log(total); // 15
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
```

### Utility Functions

#### `range(options)`

Creates an iterator that yields a sequence of numbers within a specified range. Both start and end points are inclusive.

**Parameters:**
- `options.from` - Starting number (inclusive, default: `0`)
- `options.to` - Ending number (inclusive, default: `Number.MAX_SAFE_INTEGER`)

```ts
import { range } from '@jhel/iterup'

// Basic range from 0 to 5 (inclusive)
const basic = await range({ from: 0, to: 5 }).collect();
console.log(basic); // [0, 1, 2, 3, 4, 5]

// Infinite range (be careful with collect()!)
const infinite = range({ from: 10 }); // 10, 11, 12, ...
const first5 = await infinite.take(5).collect();
console.log(first5); // [10, 11, 12, 13, 14]

// Combine with other operations
const evenSquares = await range({ from: 0, to: 10 })
  .filterMap(n => n % 2 === 0 ? n * n : None)
  .collect();
console.log(evenSquares); // [0, 4, 16, 36, 64, 100]
```

### Extension Methods

#### `.filterMap(fn)`

Combines filtering and mapping in a single efficient operation. Return `None` to filter out elements, or a value to transform and include them.

```ts
// Basic filter and map
const numbers = await iterup([1, 2, 3, 4, 5, 6])
  .filterMap(n => {
    if (n % 2 === 0) return `Even: ${n}`;
    return None; // Filter out odd numbers
  })
  .collect(); // ["Even: 2", "Even: 4", "Even: 6"]
```

#### `.findMap(fn)`

Finds the first element that matches the predicate and maps it. Consumes the iterator until a match is found.

```ts
// Find first even number
const firstEven = await iterup([1, 3, 5, 2, 4])
  .findMap(n => n % 2 === 0 ? `First even: ${n}` : None);
console.log(firstEven); // "First even: 2"
```

#### `.enumerate()`

Creates an iterator that yields `[value, index]` tuples.

```ts
const letters = await iterup(['a', 'b', 'c'])
  .enumerate()
  .collect(); // [['a', 0], ['b', 1], ['c', 2]]
```

#### `.take(count)`

Takes the first `count` elements from the iterator.

```ts
const first3 = await iterup([1, 2, 3, 4, 5])
  .take(3)
  .collect(); // [1, 2, 3]
```

#### `.drop(count)`

Skips the first `count` elements from the iterator.

```ts
const without2 = await iterup([1, 2, 3, 4, 5])
  .drop(2)
  .collect(); // [3, 4, 5]
```

#### `.collect()` / `.toArray()`

Materializes all values from the iterator into an array.

```ts
const result = await iterup([1, 2, 3])
  .map(n => n * 2)
  .collect(); // [2, 4, 6]
```

#### `.sum()` (Numeric Only)

Calculates the sum of all numeric values in the iterator.

```ts
const total = await iterup([1, 2, 3, 4, 5]).sum();
console.log(total); // 15

// Sum after filtering
const evenSum = await iterup([1, 2, 3, 4, 5, 6])
  .filterMap(n => n % 2 === 0 ? n : None)
  .sum();
console.log(evenSum); // 12 (2 + 4 + 6)
```

#### `.min()` (Numeric Only)

Finds the minimum value among all numeric values in the iterator.

```ts
const minimum = await iterup([5, 2, 8, 1, 9]).min();
console.log(minimum); // 1
```

#### `.max()` (Numeric Only)

Finds the maximum value among all numeric values in the iterator.

```ts
const maximum = await iterup([5, 2, 8, 1, 9]).max();
console.log(maximum); // 9
```

#### `.zip(anotherIterator)`

Combines the current iterator with another iterator element-wise, yielding pairs of values until one iterator is exhausted.

```ts
// Zip two arrays
const result = await iterup([1, 2, 3]).zip(['a', 'b', 'c']).collect();
console.log(result); // [[1, 'a'], [2, 'b'], [3, 'c']]

// Zip and transform
const combined = await iterup([1, 2, 3])
  .zip([10, 20, 30])
  .map(([a, b]) => a + b)
  .collect();
console.log(combined); // [11, 22, 33]
```

#### `.fold(initialValue, fn)`

Applies a function to each element and an accumulator, returning the final accumulated value.

```ts
// Sum using fold
const sum = await iterup([1, 2, 3, 4]).fold(0, (acc, val) => acc + val);
console.log(sum); // 10

// Build a string
const sentence = await iterup(['Hello', 'world'])
  .fold('', (acc, word) => acc === '' ? word : `${acc} ${word}`);
console.log(sentence); // "Hello world"
```

#### `.reduce(fn)`

Reduces the iterator to a single value using the first element as initial accumulator.

```ts
// Sum using reduce
const sum = await iterup([1, 2, 3, 4]).reduce((acc, val) => acc + val);
console.log(sum); // 10

// Find maximum
const max = await iterup([5, 2, 8, 1, 9]).reduce((acc, val) => acc > val ? acc : val);
console.log(max); // 9
```

#### `.forEach(fn)`

Executes a function for each element in the iterator, primarily for side effects.

```ts
// Log each element
await iterup([1, 2, 3]).forEach((value) => {
  console.log(`Processing: ${value}`);
});
// Logs: "Processing: 1", "Processing: 2", "Processing: 3"
```

#### `.cycle(cycles?)`

Repeats the values from the iterator for a specified number of cycles.

```ts
// Cycle through values 3 times
const result = await iterup([1, 2, 3])
  .cycle(3)
  .collect();
console.log(result); // [1, 2, 3, 1, 2, 3, 1, 2, 3]
```

### The Option Type

The `Option<T>` type represents a value that can either be present (`T`) or absent (`None`). Used in methods like `filterMap` and `findMap`.

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
```

## Type Safety

Iterup provides full TypeScript support with excellent type inference:

```ts
const numbers = iterup([1, 2, 3, 4, 5]);
// Type: Iterup<number>

const strings = numbers.map(n => n.toString());
// Type: Iterup<string>

const filtered = numbers.filterMap(n => n > 3 ? `Big: ${n}` : None);
// Type: Iterup<string>
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
