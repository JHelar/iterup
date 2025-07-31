import { Extensions } from "./extensions";
import { OverrideFunctions, type Overrides } from "./overrides";
import { isIterator } from "./utils";

export const None: unique symbol = Symbol("None");
export type None = typeof None;

export const IterupID: unique symbol = Symbol("Iterup");
export type IterupID = typeof IterupID;

export type Option<T> = None | T;

type Excludes<Value> = OverrideFunctions<Value> | "toArray";
export type Iterup<Value> = Omit<
  IteratorObject<Value, undefined, unknown>,
  Excludes<Value>
> &
  Overrides<Value> &
  Extensions<Value> & {
    [IterupID]: {};
  };

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

function fromIterable<Value>(array: Iterable<Value>): Iterup<Value> {
  const iterator = function* () {
    for (const value of array) {
      yield value;
    }
    return undefined;
  };
  return fromIterator(iterator());
}

export function iterup<Value>(
  collection: Iterable<Value> | IteratorObject<Value, undefined, unknown>
): Iterup<Value> {
  if (isIterator(collection)) {
    return fromIterator(collection);
  }
  return fromIterable(collection);
}
