/**
 * Extension methods and type definitions for the Iterup interface.
 *
 * This module defines the extension methods that are dynamically added to
 * Iterup instances, providing a fluent interface for iterator operations.
 */

import type { BaseIterator, Iterup, Option } from "./core";
import {
  collect,
  cycle,
  drop,
  enumerate,
  filter,
  filterMap,
  findMap,
  flatMap,
  fold,
  forEach,
  map,
  max,
  min,
  reduce,
  sum,
  take,
  zip,
} from "./methods";

/**
 * Function type for filtering and transforming values in filterMap operations.
 * Returns None to filter out values, or a transformed value to keep them.
 *
 * @template Value - The input value type
 * @template FilterValue - The output value type after transformation
 */
type FilterFunction<Value, FilterValue> = (
  value: Value
) => Option<FilterValue> | Promise<Option<FilterValue>>;

/**
 * Function type for transforming values in map operations.
 * Transforms each input value to an output value of potentially different type.
 *
 * @template Value - The input value type
 * @template MapValue - The output value type after transformation
 */
type MapFunction<Value, MapValue> = (
  value: Value
) => MapValue | Promise<MapValue>;

/**
 * Interface defining all extension methods available on Iterup instances.
 * These methods are dynamically added to iterator instances through a Proxy,
 * providing a fluent interface for chaining operations.
 *
 * @template Value - The type of values in the iterator
 */
export type Extensions<Value> = {
  /**
   * Transforms and filters values in a single operation. Values that transform
   * to None are filtered out, while others are transformed and kept.
   *
   * @template FilterValue - The type of the transformed values
   * @param f - Function that transforms values; return None to filter out (async supported)
   * @returns Async iterator of transformed, non-None values
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3, 4, 5])
   *   .filterMap(x => x % 2 === 0 ? x * 2 : None)
   *   .collect();
   * // result: [4, 8] (even numbers doubled)
   * ```
   */
  filterMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Iterup<FilterValue>;

  /**
   * Finds the first value that satisfies the predicate function.
   * Supports async predicates.
   *
   * @param f - Predicate function to test each value (async supported)
   * @returns Promise resolving to the first matching value or undefined
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3, 4, 5])
   *   .filter(x => x > 3);
   * // result: 4
   * ```
   */
  filter(
    f: (value: Value) => boolean | Promise<boolean>
  ): Promise<Value | undefined>;

  /**
   * Finds the first value for which the provided function returns a non-None value.
   * Returns the transformed value if found, undefined if none match.
   *
   * @template FilterValue - The type of the transformed value
   * @param f - Function that transforms values, returning None to skip or a value to return
   * @returns Promise resolving to the first transformed value or undefined if none found
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3, 4, 5])
   *   .findMap(x => x > 3 ? x * 2 : None);
   * // result: 8 (first value > 3 is 4, transformed to 8)
   * ```
   */
  findMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Promise<FilterValue | undefined>;

  /**
   * Yields pairs [value, index] for each element. Index starts at 0.
   *
   * @returns Async iterator of [value, index]
   *
   * @example
   * ```ts
   * const result = await iterup(['a', 'b', 'c'])
   *   .enumerate()
   *   .collect();
   * // result: [['a', 0], ['b', 1], ['c', 2]]
   * ```
   */
  enumerate(): Iterup<[Value, number]>;

  /**
   * Collects all values from the iterator into an array.
   * This consumes the entire iterator and returns all values as an array.
   *
   * @returns Promise resolving to an array containing all yielded values
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3]).collect();
   * // result: [1, 2, 3]
   * ```
   */
  collect(): Promise<Array<Value>>;

  /**
   * Collects all values from the iterator into an array.
   * This consumes the entire iterator and returns all values as an array.
   *
   * @returns Promise resolving to an array containing all yielded values
   */
  toArray(): Promise<Array<Value>>;

  /**
   * Transforms each value in the iterator using the provided function.
   * Supports async transformation functions.
   *
   * @template MapValue - The type of values after transformation
   * @param f - Function to transform each value (async supported)
   * @returns Async iterator of transformed values
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3])
   *   .map(x => x * 2)
   *   .collect();
   * // result: [2, 4, 6]
   * ```
   */
  map<MapValue>(f: MapFunction<Value, MapValue>): Iterup<MapValue>;

  /**
   * Transforms each value into an iterator and flattens the results.
   * Supports async transformation functions.
   *
   * @template MapValue - The type of values in the resulting flattened iterator
   * @param f - Function that transforms each value into an iterator (async supported)
   * @returns Async iterator of flattened transformed values
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3])
   *   .flatMap(x => [x, x * 2])
   *   .collect();
   * // result: [1, 2, 2, 4, 3, 6]
   * ```
   */
  flatMap<MapValue>(
    f: MapFunction<Value, Iterable<MapValue> | BaseIterator<MapValue>>
  ): Iterup<MapValue>;

  /**
   * Takes only the first n values from the iterator and stops.
   * If count <= 0, yields an empty sequence.
   *
   * @param count - Maximum number of values to take
   * @returns Async iterator with at most count values
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3, 4, 5])
   *   .take(3)
   *   .collect();
   * // result: [1, 2, 3]
   * ```
   */
  take(count: number): Iterup<Value>;

  /**
   * Skips the first n values from the iterator and yields the rest.
   * If count <= 0, yields the original sequence unchanged.
   *
   * @param count - Number of values to skip from the beginning
   * @returns Async iterator with the first count values skipped
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3, 4, 5])
   *   .drop(2)
   *   .collect();
   * // result: [3, 4, 5]
   * ```
   */
  drop(count: number): Iterup<Value>;

  /**
   * Repeats the values from the iterator for a specified number of cycles.
   * The input is consumed and cached during the first cycle; subsequent cycles
   * replay the cached values. Defaults to infinite cycles.
   *
   * @param cycles - Number of times to repeat the sequence (default: Infinity)
   * @returns Async iterator that yields the original values repeatedly
   *
   * @example
   * ```ts
   * // Cycle through values 3 times
   * const result = await iterup([1, 2, 3])
   *   .cycle(3)
   *   .collect();
   * // result: [1, 2, 3, 1, 2, 3, 1, 2, 3]
   * ```
   */
  cycle(cycles?: number): Iterup<Value>;

  /**
   * Combines two iterators element-wise, yielding pairs until one is exhausted.
   * The resulting iterator stops when the shorter of the two inputs completes.
   *
   * @template AnotherValue - The type of values in the second iterator
   * @param iterator - The second iterator to zip
   * @returns Async iterator of [Value, AnotherValue]
   *
   * @example
   * ```ts
   * const result = await iterup([1, 2, 3])
   *   .zip(['a', 'b', 'c'])
   *   .collect();
   * // result: [[1, 'a'], [2, 'b'], [3, 'c']]
   * ```
   */
  zip<AnotherValue>(
    iterator: BaseIterator<AnotherValue>
  ): Iterup<[Value, AnotherValue]>;

  /**
   * Applies a function to each element and an accumulator, returning the final value.
   * This is a fundamental operation for building other aggregation functions.
   *
   * @template NewValue - The type of the accumulator and return value
   * @param initialValue - The initial value for the accumulator
   * @param f - Function that takes (accumulator, value) and returns the new accumulator
   * @returns Promise resolving to the final accumulated value
   *
   * @example
   * ```ts
   * // Sum using fold
   * const sum = await iterup([1, 2, 3, 4])
   *   .fold(0, (acc, val) => acc + val);
   * // result: 10
   *
   * // Build a string
   * const sentence = await iterup(['Hello', 'world'])
   *   .fold('', (acc, word) => acc === '' ? word : `${acc} ${word}`);
   * // result: "Hello world"
   * ```
   */
  fold<NewValue>(
    initialValue: NewValue,
    f: (accumulator: NewValue, value: Value) => NewValue | Promise<NewValue>
  ): Promise<NewValue>;

  /**
   * Reduces the iterator to a single value using the provided function.
   * Unlike fold, reduce uses the first element as the initial accumulator value.
   * Returns undefined if the iterator is empty.
   *
   * @param f - Function that takes (accumulator, value) and returns the new accumulator
   * @returns Promise resolving to the reduced value or undefined if empty
   *
   * @example
   * ```ts
   * // Sum using reduce
   * const sum = await iterup([1, 2, 3, 4])
   *   .reduce((acc, val) => acc + val);
   * // result: 10
   *
   * // Find maximum
   * const max = await iterup([5, 2, 8, 1, 9])
   *   .reduce((acc, val) => acc > val ? acc : val);
   * // result: 9
   * ```
   */
  reduce(
    f: (accumulator: Value, value: Value) => Value | Promise<Value>
  ): Promise<Value | undefined>;

  /**
   * Executes a function for each element in the iterator, primarily for side effects.
   * This consumes the entire iterator and returns void.
   *
   * @param f - Function to execute for each value (can be async; not awaited)
   * @returns Promise that resolves when all elements have been iterated
   *
   * @example
   * ```ts
   * // Log each element
   * await iterup([1, 2, 3]).forEach((value) => {
   *   console.log(`Processing: ${value}`);
   * });
   * // Logs: "Processing: 1", "Processing: 2", "Processing: 3"
   * ```
   */
  forEach(f: (value: Value) => void | Promise<void>): Promise<void>;
};

/**
 * Object mapping extension method names to their implementations.
 * Used by the Proxy to dynamically provide extension methods on Iterup instances.
 */
export const Extensions: Record<keyof Extensions<{}>, any> = {
  filterMap,
  findMap,
  collect,
  toArray: collect,
  enumerate,
  drop,
  take,
  flatMap,
  map,
  filter,
  cycle,
  zip,
  fold,
  reduce,
  forEach,
};

/**
 * Extension methods available only for numeric iterators.
 * These methods provide mathematical operations on iterators containing numbers.
 *
 * @template Value - The numeric type of values in the iterator
 */
export type NumericExtensions<Value> = {
  /**
   * Calculates the sum of all numeric values in the iterator.
   * This method is only available for numeric iterators.
   *
   * @returns Promise resolving to the total sum
   * @throws {TypeError} If the iterator contains non-numeric values
   *
   * @example
   * ```ts
   * const total = await iterup([1, 2, 3, 4, 5]).sum();
   * // result: 15
   * ```
   */
  sum(): Promise<number>;

  /**
   * Finds the minimum value among all numeric values in the iterator.
   * This method is only available for numeric iterators.
   *
   * @returns Promise resolving to the smallest value found
   * @throws {TypeError} If the iterator contains non-numeric values
   *
   * @example
   * ```ts
   * const minimum = await iterup([5, 2, 8, 1, 9]).min();
   * // result: 1
   * ```
   */
  min(): Promise<number>;

  /**
   * Finds the maximum value among all numeric values in the iterator.
   * This method is only available for numeric iterators.
   *
   * @returns Promise resolving to the largest value found
   * @throws {TypeError} If the iterator contains non-numeric values
   *
   * @example
   * ```ts
   * const maximum = await iterup([5, 2, 8, 1, 9]).max();
   * // result: 9
   * ```
   */
  max(): Promise<number>;
};

export const NumericExtensions: Record<keyof NumericExtensions<{}>, any> = {
  sum,
  min,
  max,
};
