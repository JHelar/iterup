import type { Iterup } from "./core";

/**
 * Type definition for overridden iterator methods that return Iterup instances.
 * These methods replace the standard iterator methods to maintain chainability
 * and provide lazy evaluation throughout the operation chain.
 *
 * @template Value - The type of values in the iterator
 */
export type Overrides<Value> = {
  /**
   * Transforms each element using the provided function.
   * This is an overridden version of the standard map method that returns an Iterup instance.
   *
   * @template MapValue - The type of values after transformation
   * @param f - Function that transforms each value, receives (value, index)
   * @returns A new Iterup instance with transformed values
   *
   * @example
   * ```ts
   * const numbers = iterup([1, 2, 3]);
   * const doubled = numbers.map(n => n * 2); // Iterup<number>
   * console.log(doubled.collect()); // [2, 4, 6]
   * ```
   */
  map: <MapValue>(
    f: (value: Value, index: number) => MapValue
  ) => Iterup<MapValue>;

  /**
   * Filters elements using a type predicate function.
   * This is an overridden version of the standard filter method that returns an Iterup instance.
   *
   * @template FilterValue - The narrowed type after filtering
   * @param f - Type predicate function that determines which elements to keep
   * @returns A new Iterup instance with filtered values
   *
   * @example
   * ```ts
   * const mixed = iterup([1, null, 3, undefined, 5]);
   * const numbers = mixed.filter((x): x is number => typeof x === 'number');
   * console.log(numbers.collect()); // [1, 3, 5]
   * ```
   */
  filter: <FilterValue extends Value>(
    f: (value: Value, index: number) => value is FilterValue
  ) => Iterup<FilterValue>;

  /**
   * Maps each element to an iterable and flattens the results.
   * This is an overridden version of the standard flatMap method that returns an Iterup instance.
   *
   * @template MapValue - The type of values in the resulting flattened iterator
   * @param f - Function that maps each value to an iterable, receives (value, index)
   * @returns A new Iterup instance with flattened mapped values
   *
   * @example
   * ```ts
   * const words = iterup(['hello', 'world']);
   * const chars = words.flatMap(word => word.split(''));
   * console.log(chars.collect()); // ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']
   * ```
   */
  flatMap: <MapValue>(
    f: (
      value: Value,
      index: number
    ) =>
      | Iterable<MapValue, unknown, undefined>
      | Iterator<MapValue, unknown, undefined>
  ) => Iterup<MapValue>;
};

/**
 * Type representing the names of overridden functions.
 * Used internally to identify which methods should return Iterup instances.
 *
 * @template Value - The type of values in the iterator
 */
export type OverrideFunctions<Value> = keyof Overrides<Value>;

/**
 * Set of function names that are overridden to return Iterup instances.
 * Used internally by the proxy to determine when to wrap return values.
 */
export const OverrideFunctions: Set<OverrideFunctions<{}>> = new Set([
  "map",
  "filter",
  "flatMap",
]);
