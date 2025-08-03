import { Extensions } from "./extensions";
import { range, RangeArgument } from "./methods";
import { OverrideFunctions, type Overrides } from "./overrides";
import { isAsyncIterator, isIterable, isIterator } from "./utils";

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

/**
 * Internal type that excludes certain functions from the base iterator interface.
 * These functions are either overridden or have special handling in Iterup.
 */
type Excludes<Value> = OverrideFunctions<Value> | "toArray";

/**
 * Base async iterator type for handling asynchronous iteration.
 * @template Value - The type of values yielded by the iterator
 */
export type BaseAsyncIterator<Value> = AsyncIteratorObject<
  Value,
  unknown,
  unknown
>;

/**
 * Base synchronous iterator type for handling regular iteration.
 * @template Value - The type of values yielded by the iterator
 */
export type BaseSyncIterator<Value> = IteratorObject<Value, unknown, unknown>;

/**
 * Union type representing any kind of iterator that can be processed.
 * Includes iterables, sync iterators, and async iterators.
 * @template Value - The type of values in the iterator
 */
export type BaseIterator<Value> =
  | Iterable<Value>
  | BaseSyncIterator<Value>
  | BaseAsyncIterator<Value>;

/**
 * The main Iterup type that combines base async iterator functionality
 * with extension methods and overrides. This is the enhanced iterator
 * interface that provides functional programming capabilities.
 *
 * @template Value - The type of values yielded by the iterator
 */
export type Iterup<Value> = Omit<BaseAsyncIterator<Value>, Excludes<Value>> &
  Overrides<Value> &
  Extensions<Value> & {
    [IterupID]: {};
  };

/**
 * Creates an Iterup instance from an async iterator by wrapping it with
 * extension methods and overrides using a Proxy.
 *
 * @template Value - The type of values yielded by the iterator
 * @param iterator - The async iterator to wrap
 * @returns An enhanced Iterup instance with additional methods
 *
 * @internal This function is used internally by the main iterup function
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
 * Creates an Iterup instance from any iterable (arrays, sets, etc.) by
 * converting it to an async generator and then wrapping it.
 *
 * @template Value - The type of values in the iterable
 * @param array - The iterable to wrap (despite the name, works with any iterable)
 * @returns An enhanced Iterup instance
 *
 * @internal This function is used internally by the main iterup function
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
 * Main entry point for creating an Iterup instance from any iterator type or range.
 * This function is overloaded to handle both collections and range arguments:
 * - When passed a RangeArgument, creates a numeric range iterator
 * - When passed any other iterator/iterable, wraps it with extension methods
 * Automatically detects the input type and applies appropriate wrapping.
 *
 * @overload
 * @param range - Range configuration object to create a numeric sequence
 * @returns An Iterup instance yielding numbers in the specified range
 *
 * @overload
 * @param collection - Any iterator, iterable, or async iterator to enhance
 * @returns An Iterup instance with functional programming methods
 *
 * @example
 * ```ts
 * // From array
 * const fromArray = iterup([1, 2, 3, 4]);
 *
 * // From range argument (new overload)
 * const fromRange = iterup({ from: 0, to: 5 });
 * const rangeResult = await fromRange.collect();
 * // result: [0, 1, 2, 3, 4]
 *
 * // From async generator
 * async function* asyncGen() {
 *   yield 1; yield 2; yield 3;
 * }
 * const fromAsync = iterup(asyncGen());
 *
 * // Chain operations with range
 * const result = await iterup({ from: 1, to: 6 })
 *   .map(x => x * 2)
 *   .filter(x => x > 5)
 *   .collect();
 * // result: [6, 8, 10]
 *
 * // Chain operations with array
 * const arrayResult = await iterup([1, 2, 3, 4, 5])
 *   .map(x => x * 2)
 *   .filter(x => x > 5)
 *   .collect();
 * // result: [6, 8, 10]
 * ```
 */
export function iterup(range: RangeArgument): Iterup<number>;
export function iterup<Value>(collection: BaseIterator<Value>): Iterup<Value>;
export function iterup<Value>(
  collection: BaseIterator<Value> | RangeArgument
): Iterup<Value> | Iterup<number> {
  if (isAsyncIterator(collection)) {
    return fromAsyncIterator(collection);
  }
  if (isIterator(collection) || isIterable(collection)) {
    return fromIterable(collection);
  }

  return range(collection);
}
