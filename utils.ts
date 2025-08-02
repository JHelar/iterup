import {
  BaseAsyncIterator,
  BaseSyncIterator,
  IterupID,
  type Iterup,
} from "./core";

/**
 * Type guard function that checks if a value is a synchronous IteratorObject.
 * Determines if the given value implements the synchronous iterator protocol.
 *
 * @template Value - The type of values the iterator would yield
 * @param value - The value to check
 * @returns True if the value is a synchronous iterator, false otherwise
 *
 * @example
 * ```ts
 * const arr = [1, 2, 3];
 * const iter = arr[Symbol.iterator]();
 * const asyncGen = async function*() { yield 1; };
 *
 * console.log(isIterator(arr));       // false
 * console.log(isIterator(iter));      // true
 * console.log(isIterator(asyncGen())); // false
 * ```
 */
export function isIterator<Value>(
  value: unknown
): value is BaseSyncIterator<Value> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.iterator in value && typeof value[Symbol.iterator] === "function"
  );
}

/**
 * Type guard function that checks if a value is an AsyncIteratorObject.
 * Determines if the given value implements the asynchronous iterator protocol.
 *
 * @template Value - The type of values the async iterator would yield
 * @param value - The value to check
 * @returns True if the value is an async iterator, false otherwise
 *
 * @example
 * ```ts
 * const arr = [1, 2, 3];
 * const syncIter = arr[Symbol.iterator]();
 * const asyncGen = async function*() { yield 1; yield 2; };
 * const asyncIter = asyncGen();
 *
 * console.log(isAsyncIterator(arr));        // false
 * console.log(isAsyncIterator(syncIter));   // false
 * console.log(isAsyncIterator(asyncIter));  // true
 * ```
 */
export function isAsyncIterator<Value>(
  value: unknown
): value is BaseAsyncIterator<Value> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.asyncIterator in value &&
    typeof value[Symbol.asyncIterator] === "function"
  );
}

/**
 * Type guard function that checks if an async iterator is an Iterup instance.
 * Determines if the iterator has been enhanced with Iterup functionality.
 * Note: All Iterup instances are async iterators as of v0.1.0+.
 *
 * @template Value - The type of values the iterator yields
 * @param value - The async iterator to check
 * @returns True if the value is an Iterup instance, false otherwise
 *
 * @example
 * ```ts
 * import { iterup } from '@jhel/iterup';
 *
 * const arr = [1, 2, 3];
 * const regularAsyncIter = (async function*() { yield* arr; })();
 * const iterupInstance = iterup(arr);
 *
 * console.log(isIterup(regularAsyncIter)); // false
 * console.log(isIterup(iterupInstance));   // true
 * ```
 */
export function isIterup<Value>(
  value: BaseAsyncIterator<Value>
): value is Iterup<Value> {
  return IterupID in value;
}
