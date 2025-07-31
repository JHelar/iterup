import { fromIterator, None, type Iterup, type Option } from "../core";
import { isIterator } from "../utils";

/**
 * Creates an iterator that yields tuples of [value, index] for each element.
 * Similar to Python's enumerate() function.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterable or iterator to enumerate
 * @returns An iterator that yields [value, index] tuples
 *
 * @example
 * ```ts
 * const letters = ['a', 'b', 'c'];
 * for (const [letter, index] of enumerate(letters)) {
 *   console.log(`${index}: ${letter}`);
 * }
 * // Output: 0: a, 1: b, 2: c
 * ```
 */
export function enumerate<Value>(
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>
): Iterup<[Value, number]> {
  const generator = function* () {
    let index = 0;
    for (const value of iterator) {
      yield [value, index++] as [Value, number];
    }
    return undefined;
  };

  return fromIterator(generator());
}

/**
 * Finds the first non-None result of applying a function to each element.
 * Returns the first successful transformation, or undefined if none found.
 *
 * @template FilterValue - The type of the filtered/mapped value
 * @template Value - The type of values in the iterator
 * @param iterator - The iterable or iterator to search through
 * @param f - Function that takes a value and index, returns Option<FilterValue>
 * @returns The first non-None result, or undefined if none found
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5];
 * const firstEven = findMap(numbers, (n) => n % 2 === 0 ? n * 2 : None);
 * console.log(firstEven); // 4 (2 * 2)
 * ```
 */
export function findMap<FilterValue, Value>(
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>,
  f: (value: Value, index: number) => Option<FilterValue>
): FilterValue | undefined {
  for (const [value, index] of enumerate(iterator)) {
    const newValue = f(value, index);
    if (newValue === None) continue;
    return newValue;
  }
}

/**
 * Maps each element through a function and filters out None results.
 * Returns an iterator of all successful transformations.
 *
 * @template FilterValue - The type of the filtered/mapped values
 * @template Value - The type of values in the iterator
 * @param iterator - The iterable or iterator to filter and map
 * @param f - Function that takes a value and index, returns Option<FilterValue>
 * @returns An iterator yielding all non-None results
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5];
 * const evenDoubled = filterMap(numbers, (n) => n % 2 === 0 ? n * 2 : None);
 * console.log(collect(evenDoubled)); // [4, 8] (2*2, 4*2)
 * ```
 */
export function filterMap<FilterValue, Value>(
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>,
  f: (value: Value, index: number) => Option<FilterValue>
): Iterup<FilterValue> {
  const generator = function* () {
    for (const [value, index] of enumerate(iterator)) {
      const newValue = f(value as Value, index);
      if (newValue === None) continue;
      yield newValue;
    }
    return undefined;
  };

  return fromIterator(generator());
}

/**
 * Collects all values from an iterator into an array.
 * Efficiently converts iterators to arrays using built-in methods when available.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterable or iterator to collect from
 * @returns An array containing all values from the iterator
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5];
 * const doubled = filterMap(numbers, (n) => n * 2);
 * const result = collect(doubled);
 * console.log(result); // [2, 4, 6, 8, 10]
 * ```
 */
export function collect<Value>(
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>
): Array<Value> {
  if (isIterator(iterator)) {
    return iterator.toArray();
  }
  return Array.from(iterator);
}
