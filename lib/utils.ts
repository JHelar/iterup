/**
 * Utility functions for type checking and working with iterators.
 *
 * This module provides helper functions to determine the type of iterators
 * and check for specific iterator interfaces at runtime.
 */

import {
  BaseAsyncIterator,
  BaseSyncIterator,
  IterupID,
  None,
  type Iterup,
} from "./core";

/**
 * Type guard to check if a value is a synchronous iterator.
 * Checks for the presence of the Symbol.iterator method.
 *
 * @template Value - The type of values the iterator should yield
 * @param value - The value to check
 * @returns True if the value is a synchronous iterator
 *
 * @example
 * ```ts
 * if (isIterator(someValue)) {
 *   // someValue is now typed as BaseSyncIterator<Value>
 *   for (const item of someValue) {
 *     console.log(item);
 *   }
 * }
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
 * Type guard to check if a value is iterable (has Symbol.iterator).
 * This includes arrays, sets, maps, strings, and other iterable objects.
 *
 * @template Value - The type of values the iterable should yield
 * @param value - The value to check
 * @returns True if the value is iterable
 *
 * @example
 * ```ts
 * if (isIterable(someValue)) {
 *   // someValue is now typed as Iterable<Value>
 *   for (const item of someValue) {
 *     console.log(item);
 *   }
 * }
 *
 * // Works with various iterables
 * isIterable([1, 2, 3]); // true - Array
 * isIterable(new Set([1, 2])); // true - Set
 * isIterable("hello"); // true - String
 * isIterable(42); // false - Number
 * ```
 */
export function isIterable<Value>(value: unknown): value is Iterable<Value> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.iterator in value && typeof value[Symbol.iterator] === "function"
  );
}

/**
 * Type guard to check if a value is an asynchronous iterator.
 * Checks for the presence of the Symbol.asyncIterator method.
 *
 * @template Value - The type of values the iterator should yield
 * @param value - The value to check
 * @returns True if the value is an asynchronous iterator
 *
 * @example
 * ```ts
 * if (isAsyncIterator(someValue)) {
 *   // someValue is now typed as BaseAsyncIterator<Value>
 *   for await (const item of someValue) {
 *     console.log(item);
 *   }
 * }
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
 * Type guard to check if an async iterator is an Iterup instance.
 * Checks for the presence of the IterupID symbol that marks enhanced iterators.
 *
 * @template Value - The type of values the iterator yields
 * @param value - The async iterator to check
 * @returns True if the iterator is an Iterup instance with extension methods
 *
 * @example
 * ```ts
 * if (isIterup(someAsyncIterator)) {
 *   // someAsyncIterator now has access to extension methods
 *   const result = await someAsyncIterator.map(x => x * 2).collect();
 * }
 * ```
 */
export function isIterup<Value>(
  value: BaseAsyncIterator<Value>
): value is Iterup<Value> {
  return IterupID in value;
}

export function unwrapResult<Value>(result: IteratorResult<Value>) {
  if (result.done) return None;
  return result.value;
}
