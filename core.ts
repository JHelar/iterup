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
  unknown,
  unknown
>;
export type BaseSyncIterator<Value> = IteratorObject<Value, unknown, unknown>;
export type BaseIterator<Value> =
  | Iterable<Value>
  | BaseSyncIterator<Value>
  | BaseAsyncIterator<Value>;

export type Iterup<Value> = Omit<BaseAsyncIterator<Value>, Excludes<Value>> &
  Overrides<Value> &
  Extensions<Value> & {
    [IterupID]: {};
  };

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

function fromIterable<Value>(array: Iterable<Value>): Iterup<Value> {
  const iterator = async function* () {
    for (const value of array) {
      yield value;
    }
    return undefined;
  };
  return fromAsyncIterator(iterator());
}

export function iterup<Value>(collection: BaseIterator<Value>): Iterup<Value> {
  if (isAsyncIterator(collection)) {
    return fromAsyncIterator(collection);
  }
  return fromIterable(collection);
}
