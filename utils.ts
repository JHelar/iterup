import { IterupID, type Iterup } from "./core";

/**
 * Type guard function that checks if a value is an IteratorObject.
 * Determines if the given value implements the iterator protocol.
 *
 * @template Value - The type of values the iterator would yield
 * @param value - The value to check
 * @returns True if the value is an iterator, false otherwise
 *
 * @example
 * ```ts
 * const arr = [1, 2, 3];
 * const iter = arr[Symbol.iterator]();
 *
 * console.log(isIterator(arr));  // false
 * console.log(isIterator(iter)); // true
 * ```
 */
export function isIterator<Value>(
  value: unknown
): value is IteratorObject<Value, undefined, unknown> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.iterator in value && typeof value[Symbol.iterator] === "function"
  );
}

/**
 * Type guard function that checks if an iterator is an Iterup instance.
 * Determines if the iterator has been enhanced with Iterup functionality.
 *
 * @template Value - The type of values the iterator yields
 * @param value - The iterator to check
 * @returns True if the value is an Iterup instance, false otherwise
 *
 * @example
 * ```ts
 * import { iterup } from '@jhel/iterup';
 *
 * const arr = [1, 2, 3];
 * const regularIter = arr[Symbol.iterator]();
 * const iterupInstance = iterup(arr);
 *
 * console.log(isIterup(regularIter));    // false
 * console.log(isIterup(iterupInstance)); // true
 * ```
 */
export function isIterup<Value>(
  value: IteratorObject<Value, undefined, unknown>
): value is Iterup<Value> {
  return IterupID in value;
}
