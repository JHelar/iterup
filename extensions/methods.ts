import {
  BaseAsyncIterator,
  BaseIterator,
  BaseSyncIterator,
  fromAsyncIterator,
  None,
  type Iterup,
  type Option,
} from "../core";
import { isAsyncIterator, isIterator } from "../utils";

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
  iterator: Iterable<Value> | BaseIterator<Value>
): Iterup<[Value, number]> {
  const generator = async function* () {
    let index = 0;
    for await (const value of iterator) {
      yield [value, index++] as [Value, number];
    }
    return undefined;
  };

  return fromAsyncIterator(generator());
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
export async function findMap<FilterValue, Value>(
  iterator: Iterable<Value> | BaseIterator<Value>,
  f: (
    value: Value,
    index: number
  ) => Option<FilterValue> | Promise<Option<FilterValue>>
): Promise<FilterValue | undefined> {
  for await (const [value, index] of enumerate(iterator)) {
    let newValue = f(value, index);
    if (newValue instanceof Promise) {
      newValue = await newValue;
    }

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
  iterator: Iterable<Value> | BaseIterator<Value>,
  f: (value: Value, index: number) => Option<FilterValue> | Promise<FilterValue>
): Iterup<FilterValue> {
  const generator = async function* () {
    for await (const [value, index] of enumerate(iterator)) {
      let newValue = f(value, index);
      if (newValue instanceof Promise) {
        newValue = await newValue;
      }

      if (newValue === None) continue;
      yield newValue;
    }
    return undefined;
  };

  return fromAsyncIterator(generator());
}

export function map<Value, MapValue>(
  iterator: Iterable<Value> | BaseIterator<Value>,
  f: (value: Value, index: number) => MapValue | Promise<MapValue>
): Iterup<MapValue> {
  const generator = async function* () {
    for await (const [value, index] of enumerate(iterator)) {
      let newValue = f(value, index);
      if (newValue instanceof Promise) {
        newValue = await newValue;
      }
      yield newValue;
    }
    return undefined;
  };

  return fromAsyncIterator(generator());
}

export function flatMap<Value, MapValue>(
  iterator: Iterable<Value> | BaseIterator<Value>,
  f: (
    value: Value,
    index: number
  ) =>
    | Iterable<MapValue>
    | BaseIterator<MapValue>
    | Promise<Iterable<MapValue> | BaseIterator<MapValue>>
): Iterup<MapValue> {
  const generator = async function* () {
    for await (const [value, index] of enumerate(iterator)) {
      let newValues = f(value, index);
      if (newValues instanceof Promise) {
        newValues = await newValues;
      }

      yield* newValues;
    }
    return undefined;
  };

  return fromAsyncIterator(generator());
}

export function drop<Value>(
  iterator: Iterable<Value> | BaseIterator<Value>,
  count: number
): Iterup<Value> {
  const generator = async function* () {
    for await (const [value, index] of enumerate(iterator)) {
      if (count > index) continue;
      yield value;
    }
    return undefined;
  };

  return fromAsyncIterator(generator());
}

export function take<Value>(
  iterator: Iterable<Value> | BaseIterator<Value>,
  count: number
): Iterup<Value> {
  const generator = async function* () {
    if (count === 0) return undefined;
    for await (const [value, index] of enumerate(iterator)) {
      yield value;
      if (index + 1 >= count) break;
    }
    return undefined;
  };

  return fromAsyncIterator(generator());
}

export async function filter<Value>(
  iterator: Iterable<Value> | BaseIterator<Value>,
  f: (value: Value, index: number) => boolean | Promise<boolean>
): Promise<Value | undefined> {
  for await (const [value, index] of enumerate(iterator)) {
    if (f(value, index)) {
      return value;
    }
  }
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
export async function collect<Value>(
  iterator: Iterable<Value> | BaseIterator<Value>
): Promise<Array<Value>> {
  if (isAsyncIterator(iterator) || isIterator(iterator)) {
    const result: Value[] = [];
    for await (const value of iterator) {
      result.push(value);
    }
    return result;
  }
  return Array.from(iterator);
}
