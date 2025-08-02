import { Extensions } from "./extensions";
import { OverrideFunctions, type Overrides } from "./overrides";
import { isAsyncIterator, isIterator } from "./utils";

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

export type BaseAsyncIterator<Value> = AsyncIteratorObject<
  Value,
  undefined,
  unknown
>;
export type BaseSyncIterator<Value> = IteratorObject<Value, undefined, unknown>;
export type BaseIterator<Value> =
  | BaseSyncIterator<Value>
  | BaseAsyncIterator<Value>;

/**
 * Main Iterup type that extends AsyncIteratorObject with additional utility methods.
 * Provides lazy evaluation for chained operations like map, filter, filterMap, etc.
 * All operations are asynchronous and support both sync and async transformation functions.
 *
 * @template Value - The type of values yielded by the async iterator
 *
 * @example
 * ```ts
 * const numbers: Iterup<number> = iterup([1, 2, 3, 4, 5]);
 * const result = await numbers
 *   .filterMap(n => n % 2 === 0 ? n * 2 : None)
 *   .collect(); // [4, 8]
 *
 * // Also supports async transformation functions
 * const asyncResult = await numbers
 *   .map(async n => await processAsync(n))
 *   .collect();
 * ```
 */
export type Iterup<Value> = Omit<BaseAsyncIterator<Value>, Excludes<Value>> &
  Overrides<Value> &
  Extensions<Value> & {
    [IterupID]: {};
  };

/**
 * Creates an Iterup instance from an existing AsyncIteratorObject.
 * This function wraps the async iterator with a proxy that provides additional methods.
 *
 * @template Value - The type of values yielded by the async iterator
 * @param iterator - The async iterator to wrap with Iterup functionality
 * @returns An Iterup instance with extended async methods
 *
 * @example
 * ```ts
 * const asyncGenerator = async function* () {
 *   yield 1;
 *   yield 2;
 *   yield 3;
 * };
 *
 * const iterupInstance = fromAsyncIterator(asyncGenerator());
 * const result = await iterupInstance.collect(); // [1, 2, 3]
 * ```
 */
export function fromAsyncIterator<Value>(
  iterator: BaseAsyncIterator<Value>
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
            return iterup(func);
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
 * Creates an Iterup instance from an existing synchronous IteratorObject.
 * This function converts the sync iterator to async and wraps it with Iterup functionality.
 * All Iterup instances are async iterators for consistent API design.
 *
 * @template Value - The type of values yielded by the iterator
 * @param iterator - The synchronous iterator to wrap with Iterup functionality
 * @returns An Iterup instance with extended async methods
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
 * const result = await iterupInstance.collect(); // [1, 2, 3]
 * ```
 */
export function fromIterator<Value>(
  iterator: BaseSyncIterator<Value>
): Iterup<Value> {
  const generator = async function* () {
    for (const value of iterator) {
      yield value;
    }
    return undefined;
  };
  return fromAsyncIterator(generator());
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
  const iterator = async function* () {
    for (const value of array) {
      yield value;
    }
    return undefined;
  };
  return fromAsyncIterator(iterator());
}

/**
 * Main factory function for creating Iterup instances from iterables, sync iterators, or async iterators.
 * Automatically detects the input type and creates the appropriate async Iterup instance.
 * All Iterup instances are async iterators for consistent API design.
 *
 * @template Value - The type of values in the collection
 * @param collection - An iterable (array, set, string, etc.), sync iterator, or async iterator to wrap
 * @returns An Iterup instance with lazy evaluation methods (always async)
 *
 * @example
 * ```ts
 * // From array
 * const numbers = iterup([1, 2, 3, 4, 5]);
 * const result = await numbers.collect(); // [1, 2, 3, 4, 5]
 *
 * // From set
 * const uniqueNumbers = iterup(new Set([1, 2, 2, 3]));
 *
 * // From string
 * const chars = iterup("hello");
 *
 * // From async generator
 * const asyncGen = async function*() {
 *   for (let i = 0; i < 3; i++) {
 *     yield await Promise.resolve(i);
 *   }
 * };
 * const asyncNumbers = iterup(asyncGen());
 *
 * // Chain operations lazily (all operations are async)
 * const result = await numbers
 *   .filterMap(n => n % 2 === 0 ? n * 2 : None)
 *   .collect(); // [4, 8]
 *
 * // Support async transformation functions
 * const asyncResult = await numbers
 *   .map(async n => await someAsyncOperation(n))
 *   .collect();
 * ```
 */
export function iterup<Value>(
  collection: Iterable<Value> | BaseIterator<Value>
): Iterup<Value> {
  if (isIterator(collection)) {
    return fromIterator(collection);
  }
  if (isAsyncIterator(collection)) {
    return fromAsyncIterator(collection);
  }
  return fromIterable(collection);
}
