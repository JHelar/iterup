import {
  BaseIterator,
  fromAsyncIterator,
  iterup,
  None,
  type Iterup,
  type Option,
} from "./core";
import { isAsyncIterator, isIterator } from "./utils";

/**
 * Creates an iterator that yields pairs of [value, index] for each element.
 * The index starts at 0 and increments with each iteration.
 *
 * @template Value - The type of values in the input iterator
 * @param iterator - The iterator to enumerate
 * @returns An Iterup yielding [value, index] tuples
 *
 * @example
 * ```ts
 * const result = await iterup(['a', 'b', 'c'])
 *   .enumerate()
 *   .collect();
 * // result: [['a', 0], ['b', 1], ['c', 2]]
 * ```
 */
export function enumerate<Value>(
  iterator: BaseIterator<Value>
): Iterup<[Value, number]> {
  const generator = async function* () {
    let index = 0;
    for await (const value of iterator) {
      yield [value, index++] as [Value, number];
    }
  };

  return fromAsyncIterator(generator());
}

/**
 * Finds the first value for which the provided function returns a non-None value.
 * Similar to Array.find() but with transformation capabilities.
 *
 * @template FilterValue - The type of the transformed value
 * @template Value - The type of values in the input iterator
 * @param iterator - The iterator to search through
 * @param f - Function that transforms values, returning None to skip or a value to return
 * @returns Promise resolving to the first transformed value or undefined if none found
 *
 * @example
 * ```ts
 * const result = await findMap(
 *   iterup([1, 2, 3, 4, 5]),
 *   x => x > 3 ? x * 2 : None
 * );
 * // result: 8 (first value > 3 is 4, transformed to 8)
 * ```
 */
export async function findMap<FilterValue, Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => Option<FilterValue> | Promise<Option<FilterValue>>
): Promise<FilterValue | undefined> {
  for await (const value of iterator) {
    let newValue = f(value);
    if (newValue instanceof Promise) {
      newValue = await newValue;
    }

    if (newValue === None) continue;
    return newValue;
  }
}

/**
 * Transforms and filters values in a single operation. Values that transform
 * to None are filtered out, while others are transformed and kept.
 *
 * @template FilterValue - The type of the transformed values
 * @template Value - The type of values in the input iterator
 * @param iterator - The iterator to filter and transform
 * @param f - Function that transforms values, returning None to filter out
 * @returns An Iterup with transformed and filtered values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .filterMap(x => x % 2 === 0 ? x * 2 : None)
 *   .collect();
 * // result: [4, 8] (even numbers doubled)
 * ```
 */
export function filterMap<FilterValue, Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => Option<FilterValue> | Promise<FilterValue>
): Iterup<FilterValue> {
  const generator = async function* () {
    for await (const value of iterator) {
      let newValue = f(value);
      if (newValue instanceof Promise) {
        newValue = await newValue;
      }

      if (newValue === None) continue;
      yield newValue;
    }
  };

  return fromAsyncIterator(generator());
}

/**
 * Transforms each value in the iterator using the provided function.
 * Similar to Array.map() but for iterators and supports async functions.
 *
 * @template Value - The type of values in the input iterator
 * @template MapValue - The type of values after transformation
 * @param iterator - The iterator to transform
 * @param f - Function to transform each value
 * @returns An Iterup with transformed values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3])
 *   .map(x => x * 2)
 *   .collect();
 * // result: [2, 4, 6]
 * ```
 */
export function map<Value, MapValue>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => MapValue | Promise<MapValue>
): Iterup<MapValue> {
  const generator = async function* () {
    for await (const value of iterator) {
      let newValue = f(value);
      if (newValue instanceof Promise) {
        newValue = await newValue;
      }
      yield newValue;
    }
  };

  return fromAsyncIterator(generator());
}

/**
 * Transforms each value into an iterator and flattens the results.
 * Similar to Array.flatMap() but for iterators and supports async functions.
 *
 * @template Value - The type of values in the input iterator
 * @template MapValue - The type of values in the resulting flattened iterator
 * @param iterator - The iterator to transform and flatten
 * @param f - Function that transforms each value into an iterator
 * @returns An Iterup with flattened transformed values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3])
 *   .flatMap(x => [x, x * 2])
 *   .collect();
 * // result: [1, 2, 2, 4, 3, 6]
 * ```
 */
export function flatMap<Value, MapValue>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => BaseIterator<MapValue> | Promise<BaseIterator<MapValue>>
): Iterup<MapValue> {
  const generator = async function* () {
    for await (const value of iterator) {
      let newValues = f(value);
      if (newValues instanceof Promise) {
        newValues = await newValues;
      }

      yield* newValues;
    }
  };

  return fromAsyncIterator(generator());
}

/**
 * Skips the first n values from the iterator and returns the rest.
 * If count is 0 or negative, returns the original iterator unchanged.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to drop values from
 * @param count - Number of values to skip from the beginning
 * @returns An Iterup with the first count values skipped
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .drop(2)
 *   .collect();
 * // result: [3, 4, 5]
 * ```
 */
export function drop<Value>(
  iterator: BaseIterator<Value>,
  count: number
): Iterup<Value> {
  if (count <= 0) {
    return iterup(iterator);
  }

  const generator = async function* () {
    for await (const value of iterator) {
      if (count-- > 0) continue;
      yield value;
    }
  };

  return fromAsyncIterator(generator());
}

/**
 * Takes only the first n values from the iterator and stops.
 * If count is 0 or negative, returns an empty iterator.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to take values from
 * @param count - Maximum number of values to take
 * @returns An Iterup with at most count values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .take(3)
 *   .collect();
 * // result: [1, 2, 3]
 * ```
 */
export function take<Value>(
  iterator: BaseIterator<Value>,
  count: number
): Iterup<Value> {
  if (count <= 0) {
    return iterup([]);
  }

  const generator = async function* () {
    for await (const value of iterator) {
      yield value;
      if (count-- <= 1) break;
    }
  };

  return fromAsyncIterator(generator());
}

/**
 * Finds the first value that satisfies the predicate function.
 * Similar to Array.find() but for iterators and supports async predicates.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to search through
 * @param f - Predicate function to test each value
 * @returns Promise resolving to the first matching value or undefined
 *
 * @example
 * ```ts
 * const result = await filter(
 *   iterup([1, 2, 3, 4, 5]),
 *   x => x > 3
 * );
 * // result: 4
 * ```
 */
export async function filter<Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => boolean | Promise<boolean>
): Promise<Value | undefined> {
  for await (const value of iterator) {
    if (f(value)) {
      return value;
    }
  }
}

/**
 * Collects all values from the iterator into an array.
 * This consumes the entire iterator and returns all values as an array.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to collect values from
 * @returns Promise resolving to an array containing all values
 *
 * @example
 * ```ts
 * const result = await collect(iterup([1, 2, 3]));
 * // result: [1, 2, 3]
 *
 * // Often used at the end of a chain
 * const processed = await iterup([1, 2, 3, 4, 5])
 *   .map(x => x * 2)
 *   .filter(x => x > 5)
 *   .collect();
 * ```
 */
export async function collect<Value>(
  iterator: BaseIterator<Value>
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
