# @jhel/iterup

A TypeScript iterator utility library that provides lazy evaluation for efficient data processing. Using the iterator API, operations like `map`, `filter`, and `filterMap` don't consume values or create intermediate arrays until you call a consuming method like `collect()` or `toArray()`.

This makes it significantly more performant than chaining multiple `.map()`, `.filter()` operations on arrays directly, especially for large datasets or when only partial consumption is needed.

## Features

- 🚀 **Lazy evaluation** - Operations are deferred until consumption
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

const numbers = iterup([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .filter(n => n % 2 === 0)        // Keep only even numbers
  .map(n => n * 2)                 // Double them
  .filterMap(n => n > 10 ? `Big: ${n}` : None)  // Transform big numbers
  .collect();                      // Materialize the result

console.log(numbers); // ["Big: 12", "Big: 16", "Big: 20"]
```

## API Reference

### Creating Iterup Instances

#### `iterup(collection)`

Creates an Iterup instance from any iterable (arrays, sets, strings, etc.) or iterator.

```ts
import { iterup } from '@jhel/iterup'

// From array
const numbers = iterup([1, 2, 3, 4, 5]);

// From set
const uniqueNumbers = iterup(new Set([1, 2, 2, 3]));

// From string
const chars = iterup("hello");

// From generator
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
import { filterMap, findMap, enumerate, collect, None } from '@jhel/iterup'

const data = [1, 2, 3, 4, 5];

// Filter and map in one operation
const result = filterMap(data, (n) => n % 2 === 0 ? n * 2 : None);
console.log(collect(result)); // [4, 8]

// Find and map the first match
const firstEven = findMap(data, (n) => n % 2 === 0 ? `Even: ${n}` : None);
console.log(firstEven); // "Even: 2"
```

### Core Methods

#### `.map(fn)`

Transforms each element using the provided function.

```ts
const doubled = iterup([1, 2, 3])
  .map(n => n * 2)
  .collect(); // [2, 4, 6]
```

#### `.filter(predicate)`

Filters elements using a predicate function with type narrowing support.

```ts
const numbers = iterup([1, null, 3, undefined, 5])
  .filter((x): x is number => typeof x === 'number')
  .collect(); // [1, 3, 5]
```

#### `.flatMap(fn)`

Maps each element to an iterable and flattens the results.

```ts
const words = iterup(['hello', 'world'])
  .flatMap(word => word.split(''))
  .collect(); // ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']
```

### Extension Methods

#### `.filterMap(fn)`

Combines filtering and mapping in a single efficient operation. Return `None` to filter out elements, or a value to transform and include them.

```ts
const numbers = iterup([1, 2, 3, 4, 5, 6])
  .filterMap(n => {
    if (n % 2 === 0) return `Even: ${n}`;
    return None; // Filter out odd numbers
  })
  .collect(); // ["Even: 2", "Even: 4", "Even: 6"]
```

#### `.findMap(fn)`

Finds the first element that matches the predicate and maps it. Consumes the iterator until a match is found.

```ts
const numbers = iterup([1, 3, 5, 2, 4])
  .findMap(n => n % 2 === 0 ? `First even: ${n}` : None);
console.log(numbers); // "First even: 2"
```

#### `.enumerate()`

Creates an iterator that yields `[value, index]` tuples, similar to Python's `enumerate()`.

```ts
const letters = iterup(['a', 'b', 'c'])
  .enumerate()
  .collect(); // [['a', 0], ['b', 1], ['c', 2]]

// Useful for indexed operations
const indexed = iterup(['apple', 'banana', 'cherry'])
  .enumerate()
  .map(([fruit, i]) => `${i + 1}. ${fruit}`)
  .collect(); // ["1. apple", "2. banana", "3. cherry"]
```

#### `.collect()` / `.toArray()`

Materializes all values from the iterator into an array. This consumes the iterator.

```ts
const result = iterup([1, 2, 3])
  .map(n => n * 2)
  .collect(); // [2, 4, 6]

// .toArray() is an alias for .collect()
const same = iterup([1, 2, 3])
  .map(n => n * 2)
  .toArray(); // [2, 4, 6]
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

const results = iterup([-2, -1, 0, 1, 2])
  .filterMap(processNumber)
  .collect();
// ["Negative: -2", "Negative: -1", "Positive: 1", "Positive: 2"]
```

## Advanced Examples

### Processing Large Datasets

```ts
// Efficiently process large datasets without intermediate arrays
const processLargeDataset = (data: number[]) => {
  return iterup(data)
    .filter(n => n > 0)                    // Keep positive numbers
    .map(n => Math.sqrt(n))                // Calculate square root
    .filterMap(n => {                      // Filter and format
      if (n > 10) return `Large: ${n.toFixed(2)}`;
      if (n > 1) return `Medium: ${n.toFixed(2)}`;
      return None; // Skip small numbers
    })
    .enumerate()                           // Add indices
    .map(([value, i]) => `${i}: ${value}`) // Format with index
    .collect();
};
```

### Working with Async Iterators

```ts
async function* asyncNumbers() {
  for (let i = 1; i <= 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    yield i;
  }
}

// Note: Currently iterup works with sync iterators
// For async iterators, you can collect first:
const asyncResults = [];
for await (const value of asyncNumbers()) {
  asyncResults.push(value);
}

const processed = iterup(asyncResults)
  .filterMap(n => n % 2 === 0 ? n * 2 : None)
  .collect(); // [4, 8]
```

### Type-Safe Data Transformation

```ts
interface User {
  id: number;
  name: string;
  age?: number;
}

const users: User[] = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie", age: 25 },
];

const adultNames = iterup(users)
  .filterMap(user => user.age && user.age >= 18 ? user.name : None)
  .collect(); // ["Alice", "Charlie"]
```

## Performance Benefits

The lazy evaluation approach provides several performance advantages:

1. **Memory efficiency**: No intermediate arrays are created
2. **Early termination**: Operations like `findMap` stop as soon as a match is found
3. **Composability**: Complex operations can be built up without performance penalties
4. **Large dataset handling**: Process datasets that might not fit in memory all at once

```ts
// Traditional approach - creates intermediate arrays
const traditional = data
  .map(x => expensiveOperation(x))    // Creates intermediate array
  .filter(x => x > threshold)        // Creates another intermediate array
  .slice(0, 10);                     // Finally take what we need

// Iterup approach - lazy evaluation
const lazy = iterup(data)
  .map(x => expensiveOperation(x))    // No intermediate arrays
  .filter(x => x > threshold)        // Still no arrays
  .take(10)                          // Only process what's needed
  .collect();                        // Single array creation
```

## Type Safety

Iterup is built with TypeScript-first design, providing excellent type inference and safety:

```ts
const numbers = iterup([1, 2, 3, 4, 5]);
// Type: Iterup<number>

const strings = numbers.map(n => n.toString());
// Type: Iterup<string>

const evens = numbers.filter((n): n is number => n % 2 === 0);
// Type: Iterup<number> (with type narrowing)

const processed = numbers.filterMap(n => n > 3 ? `Big: ${n}` : None);
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

## License

MIT License - see LICENSE file for details.
