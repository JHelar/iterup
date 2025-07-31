import { Extensions } from "./extensions";
import { OverrideFunctions, type Overrides } from "./overrides";
import { isIterator } from "./utils";

/**
 * Sentinel value representing the absence of a value in Option types.
 * Used to indicate that a value should be filtered out or is not present.
 *
 * @example
 * ```ts
 * import { None } from '@jhel/iterup';
 *
 * const result = someValue > 10 ? someValue * 2 : None;
 * ```
 */
export const None: unique symbol = Symbol("None");

/**
 * Type representing the None sentinel value.
 */
export type None = typeof None;

/**
 * Unique identifier symbol for Iterup instances.
 * Used internally to distinguish Iterup objects from regular iterators.
 */
export const IterupID: unique symbol = Symbol("Iterup");

/**
 * Type representing the Iterup identifier.
 */
export type IterupID = typeof IterupID;

/**
 * Represents an optional value that can either be a value of type T or None.
 * Used in methods like filterMap and findMap to indicate presence or absence of a value.
 *
 * @template T - The type of the value when present
 *
 * @example
 * ```ts
 * function processNumber(n: number): Option<string> {
 *   if (n > 0) return `Positive: ${n}`;
 *   return None;
 * }
 * ```
 */
export type Option<T> = None | T;

type Excludes<Value> = OverrideFunctions<Value> | "toArray";

/**
 * Main Iterup type that extends IteratorObject with additional utility methods.
 * Provides lazy evaluation for chained operations like map, filter, filterMap, etc.
 *
 * @template Value - The type of values yielded by the iterator
 *
 * @example
 * ```ts
 * const numbers: Iterup<number> = iterup([1, 2, 3, 4, 5]);
 * const result = numbers
 *   .filter(n => n % 2 === 0)
 *   .map(n => n * 2)
 *   .collect(); // [4, 8]
 * ```
 */
export type Iterup<Value> = Omit<
  IteratorObject<Value, undefined, unknown>,
  Excludes<Value>
> &
  Overrides<Value> &
  Extensions<Value> & {
    [IterupID]: {};
  };

/**
 * Creates an Iterup instance from an existing IteratorObject.
 * This function wraps the iterator with a proxy that provides additional methods.
 *
 * @template Value - The type of values yielded by the iterator
 * @param iterator - The iterator to wrap with Iterup functionality
 * @returns An Iterup instance with extended methods
 *
 * @example
 * ```ts
 * const generator = function* () {
 *   yield 1;
 *   yield 2;
 *   yield 3;
 * };
 *
 * const iterupInstance = fromIterator(generator());
 * ```
 */
export function fromIterator<Value>(
  iterator: IteratorObject<Value, undefined, unknown>
): Iterup<Value> {
  const proxy = new Proxy(iterator, {
    get(target, prop, receiver) {
      const extension = Extensions[prop as keyof typeof Extensions];
      if (extension) {
        return function (...args: any[]) {
          return (extension as any).apply(null, [target, ...args] as any);
        };
      }

      const value = target[prop as keyof typeof target];
      if (value instanceof Function) {
        return function (this: any, ...args: any[]) {
          const func = (value as any).apply(
            this === receiver ? target : this,
            args
          );
          if (OverrideFunctions.has(prop as OverrideFunctions<Value>)) {
            return fromIterator(func);
          }
          return func;
        };
      }
      return value;
    },
  });
  Object.defineProperty(proxy, IterupID, {});

  return proxy as Iterup<Value>;
}

/**
 * Creates an Iterup instance from any iterable (arrays, sets, strings, etc.).
 * This function converts the iterable to an iterator and wraps it with Iterup functionality.
 *
 * @template Value - The type of values in the iterable
 * @param array - The iterable to convert to an Iterup instance
 * @returns An Iterup instance with extended methods
 */
function fromIterable<Value>(array: Iterable<Value>): Iterup<Value> {
  const iterator = function* () {
    for (const value of array) {
      yield value;
    }
    return undefined;
  };
  return fromIterator(iterator());
}

/**
 * Main factory function for creating Iterup instances from iterables or iterators.
 * Automatically detects the input type and creates the appropriate Iterup instance.
 *
 * @template Value - The type of values in the collection
 * @param collection - An iterable (array, set, string, etc.) or iterator to wrap
 * @returns An Iterup instance with lazy evaluation methods
 *
 * @example
 * ```ts
 * // From array
 * const numbers = iterup([1, 2, 3, 4, 5]);
 *
 * // From set
 * const uniqueNumbers = iterup(new Set([1, 2, 2, 3]));
 *
 * // From string
 * const chars = iterup("hello");
 *
 * // Chain operations lazily
 * const result = numbers
 *   .filterMap(n => n % 2 === 0 ? n * 2 : None)
 *   .collect(); // [4, 8]
 * ```
 */
export function iterup<Value>(
  collection: Iterable<Value> | IteratorObject<Value, undefined, unknown>
): Iterup<Value> {
  if (isIterator(collection)) {
    return fromIterator(collection);
  }
  return fromIterable(collection);
}
