import type { BaseIterator, Iterup, Option } from "../core";
import {
  collect,
  drop,
  enumerate,
  filter,
  filterMap,
  findMap,
  flatMap,
  map,
  take,
} from "./methods";

/**
 * Type definition for filter functions used in extension methods.
 * These functions take a value and index, returning an Option type to indicate
 * whether the value should be included (with potential transformation) or filtered out.
 * Supports both synchronous and asynchronous functions.
 *
 * @template Value - The input value type
 * @template FilterValue - The output value type after filtering/mapping
 */
type FilterFunction<Value, FilterValue> = (
  value: Value,
  index: number
) => Option<FilterValue> | Promise<Option<FilterValue>>;

/**
 * Type definition for mapping functions used in extension methods.
 * These functions transform values and support both synchronous and asynchronous operations.
 *
 * @template Value - The input value type
 * @template MapValue - The output value type after mapping
 */
type MapFunction<Value, MapValue> = (
  value: Value,
  index: number
) => MapValue | Promise<MapValue>;

/**
 * Type definition for extension methods added to Iterup instances.
 * These methods provide additional functionality beyond the standard iterator protocol.
 * All methods work with async iterators and support both sync and async transformation functions.
 *
 * @template Value - The type of values in the iterator
 */
export type Extensions<Value> = {
  /**
   * Filters and maps elements in a single operation.
   * Returns None to filter out elements, or a value to transform and include them.
   * Supports both synchronous and asynchronous transformation functions.
   *
   * @template FilterValue - The type of values after filtering and mapping
   * @param f - Function that takes (value, index) and returns Option<FilterValue> or Promise<Option<FilterValue>>
   * @returns A new Iterup instance with filtered and mapped values
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3, 4, 5]);
   * const evenDoubled = await numbers.filterMap(n =>
   *   n % 2 === 0 ? n * 2 : None
   * ).collect(); // [4, 8]
   *
   * // With async transformation
   * const asyncResult = await numbers.filterMap(async n => {
   *   const processed = await processAsync(n);
   *   return processed > 10 ? processed : None;
   * }).collect();
   * ```
   */
  filterMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Iterup<FilterValue>;

  /**
   * Finds the first element that matches a predicate function.
   * This method consumes the iterator until a match is found or the iterator is exhausted.
   * Supports both synchronous and asynchronous predicate functions.
   *
   * @param f - Function that takes (value, index) and returns boolean or Promise<boolean>
   * @returns Promise that resolves to the first matching value, or undefined if no match found
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3, 4, 5]);
   * const firstEven = await numbers.filter(n => n % 2 === 0);
   * console.log(firstEven); // 2
   *
   * // With async predicate
   * const asyncMatch = await numbers.filter(async n => {
   *   const isValid = await validateAsync(n);
   *   return isValid;
   * });
   * ```
   */
  filter(
    f: (value: Value, index: number) => boolean | Promise<boolean>
  ): Promise<Value | undefined>;

  /**
   * Finds the first element that matches the predicate and maps it.
   * This method consumes the iterator until a match is found or the iterator is exhausted.
   * Supports both synchronous and asynchronous transformation functions.
   *
   * @template FilterValue - The type of the mapped result
   * @param f - Function that takes (value, index) and returns Option<FilterValue> or Promise<Option<FilterValue>>
   * @returns Promise that resolves to the first mapped result, or undefined if no match found
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3, 4, 5]);
   * const firstEven = await numbers.findMap(n =>
   *   n % 2 === 0 ? `Found even: ${n}` : None
   * );
   * console.log(firstEven); // "Found even: 2"
   *
   * // With async transformation
   * const asyncResult = await numbers.findMap(async n => {
   *   const processed = await processAsync(n);
   *   return processed > 0 ? `Result: ${processed}` : None;
   * });
   * ```
   */
  findMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Promise<FilterValue | undefined>;

  /**
   * Creates an iterator that yields [value, index] tuples.
   * Similar to Python's enumerate() function, providing indexed iteration.
   *
   * @returns A new Iterup instance yielding [value, index] pairs
   *
   * @example
   * ```ts
   * const letters = iterup(['a', 'b', 'c']);
   * const indexed = await letters.enumerate().collect();
   * console.log(indexed); // [['a', 0], ['b', 1], ['c', 2]]
   * ```
   */
  enumerate(): Iterup<[Value, number]>;

  /**
   * Collects all values from the iterator into an array.
   * This method consumes the iterator and materializes all values asynchronously.
   *
   * @returns Promise that resolves to an array containing all values from the iterator
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3]).map(n => n * 2);
   * const result = await numbers.collect(); // [2, 4, 6]
   * ```
   */
  collect(): Promise<Array<Value>>;

  /**
   * Alias for collect(). Collects all values into an array.
   * Provides compatibility with the standard Array.from() pattern.
   * This method consumes the iterator and materializes all values asynchronously.
   *
   * @returns Promise that resolves to an array containing all values from the iterator
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3]).map(n => n * 2);
   * const result = await numbers.toArray(); // [2, 4, 6]
   * ```
   */
  toArray(): Promise<Array<Value>>;

  /**
   * Transforms each element using the provided function.
   * Supports both synchronous and asynchronous transformation functions.
   *
   * @template MapValue - The type of values after transformation
   * @param f - Function that takes (value, index) and returns MapValue or Promise<MapValue>
   * @returns A new Iterup instance with transformed values
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3]);
   * const doubled = await numbers.map(n => n * 2).collect(); // [2, 4, 6]
   *
   * // With async transformation
   * const asyncResult = await numbers.map(async n => {
   *   return await processAsync(n);
   * }).collect();
   *
   * // With index parameter
   * const indexed = await iterup(['a', 'b', 'c'])
   *   .map((value, index) => `${index}: ${value}`)
   *   .collect(); // ['0: a', '1: b', '2: c']
   * ```
   */
  map<MapValue>(f: MapFunction<Value, MapValue>): Iterup<MapValue>;

  /**
   * Maps each element to an iterable and flattens the results.
   * Supports both synchronous and asynchronous transformation functions.
   *
   * @template MapValue - The type of values in the resulting flattened iterator
   * @param f - Function that maps each value to an iterable, receives (value, index)
   * @returns A new Iterup instance with flattened mapped values
   *
   * @example
   * ```ts
   * const words = iterup(['hello', 'world']);
   * const chars = await words.flatMap(word => word.split('')).collect();
   * console.log(chars); // ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']
   *
   * // With async transformation
   * const asyncResult = await iterup([1, 2])
   *   .flatMap(async x => {
   *     const expanded = await expandAsync(x);
   *     return [x, expanded];
   *   })
   *   .collect();
   * ```
   */
  flatMap<MapValue>(
    f: MapFunction<Value, Iterable<MapValue> | BaseIterator<MapValue>>
  ): Iterup<MapValue>;

  /**
   * Takes the first `count` elements from the iterator.
   * Useful for limiting results and implementing pagination.
   *
   * @param count - Number of elements to take from the beginning
   * @returns A new Iterup instance containing at most `count` elements
   *
   * @example
   * ```ts
   * const first3 = await iterup([1, 2, 3, 4, 5])
   *   .take(3)
   *   .collect(); // [1, 2, 3]
   *
   * // Useful for limiting expensive operations
   * const limitedResults = await iterup(largeDataset)
   *   .map(expensiveOperation)
   *   .take(10)  // Only process first 10 items
   *   .collect();
   * ```
   */
  take(count: number): Iterup<Value>;

  /**
   * Skips the first `count` elements from the iterator.
   * Useful for implementing pagination and skipping headers.
   *
   * @param count - Number of elements to skip from the beginning
   * @returns A new Iterup instance with the first `count` elements removed
   *
   * @example
   * ```ts
   * const withoutFirst2 = await iterup([1, 2, 3, 4, 5])
   *   .drop(2)
   *   .collect(); // [3, 4, 5]
   *
   * // Skip header rows in data processing
   * const dataRows = await iterup(csvLines)
   *   .drop(1)  // Skip header
   *   .map(parseCsvLine)
   *   .collect();
   * ```
   */
  drop(count: number): Iterup<Value>;
};

/**
 * Implementation object mapping extension method names to their implementations.
 * Used internally by the proxy to provide extension methods on Iterup instances.
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
};
