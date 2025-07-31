import type { Iterup, Option } from "../core";
import { collect, enumerate, filterMap, findMap } from "./methods";

/**
 * Type definition for filter functions used in extension methods.
 * These functions take a value and index, returning an Option type to indicate
 * whether the value should be included (with potential transformation) or filtered out.
 *
 * @template Value - The input value type
 * @template FilterValue - The output value type after filtering/mapping
 */
type FilterFunction<Value, FilterValue> = (
  value: Value,
  index: number
) => Option<FilterValue>;

/**
 * Type definition for extension methods added to Iterup instances.
 * These methods provide additional functionality beyond the standard iterator protocol.
 *
 * @template Value - The type of values in the iterator
 */
export type Extensions<Value> = {
  /**
   * Filters and maps elements in a single operation.
   * Returns None to filter out elements, or a value to transform and include them.
   *
   * @template FilterValue - The type of values after filtering and mapping
   * @param f - Function that takes (value, index) and returns Option<FilterValue>
   * @returns A new Iterup instance with filtered and mapped values
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3, 4, 5]);
   * const evenDoubled = numbers.filterMap(n =>
   *   n % 2 === 0 ? n * 2 : None
   * );
   * console.log(evenDoubled.collect()); // [4, 8]
   * ```
   */
  filterMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Iterup<FilterValue>;

  /**
   * Finds the first element that matches the predicate and maps it.
   * This method consumes the iterator until a match is found or the iterator is exhausted.
   *
   * @template FilterValue - The type of the mapped result
   * @param f - Function that takes (value, index) and returns Option<FilterValue>
   * @returns The first mapped result, or undefined if no match found
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3, 4, 5]);
   * const firstEven = numbers.findMap(n =>
   *   n % 2 === 0 ? `Found even: ${n}` : None
   * );
   * console.log(firstEven); // "Found even: 2"
   * ```
   */
  findMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): FilterValue | undefined;

  /**
   * Creates an iterator that yields [value, index] tuples.
   * Similar to Python's enumerate() function, providing indexed iteration.
   *
   * @returns A new Iterup instance yielding [value, index] pairs
   *
   * @example
   * ```ts
   * const letters = iterup(['a', 'b', 'c']);
   * const indexed = letters.enumerate();
   * console.log(indexed.collect()); // [['a', 0], ['b', 1], ['c', 2]]
   * ```
   */
  enumerate(): Iterup<[Value, number]>;

  /**
   * Collects all values from the iterator into an array.
   * This method consumes the iterator and materializes all values.
   *
   * @returns An array containing all values from the iterator
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3]).map(n => n * 2);
   * const result = numbers.collect(); // [2, 4, 6]
   * ```
   */
  collect(): Array<Value>;

  /**
   * Alias for collect(). Collects all values into an array.
   * Provides compatibility with the standard Array.from() pattern.
   *
   * @returns An array containing all values from the iterator
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3]).map(n => n * 2);
   * const result = numbers.toArray(); // [2, 4, 6]
   * ```
   */
  toArray(): Array<Value>;
};

/**
 * Implementation object mapping extension method names to their implementations.
 * Used internally by the proxy to provide extension methods on Iterup instances.
 */
export const Extensions = {
  filterMap,
  findMap,
  collect,
  toArray: collect,
  enumerate,
} satisfies Record<keyof Extensions<{}>, any>;
