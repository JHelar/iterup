export const None: unique symbol = Symbol("None");
const IterupID: unique symbol = Symbol("Iterup");
type None = typeof None;

type Option<T> = None | T;

type FilterFunction<Value, FilterValue> = (
  value: Value,
  index: number
) => Option<FilterValue>;

type Iterup<Value> = Omit<
  IteratorObject<Value, undefined, unknown>,
  Excludes<Value>
> &
  Overrides<Value> &
  Extensions<Value> & {
    [IterupID]: {};
  };

export function enumerate<Value>(
  iterator: IteratorObject<Value, undefined, unknown>
) {
  const generator = function* () {
    let index = 0;
    for (const value of iterator) {
      yield [value, index++] as [Value, number];
    }
    return undefined;
  };

  return fromIterator(generator());
}

export function findMap<FilterValue, Value>(
  iterator: IteratorObject<Value, undefined, unknown>,
  f: (value: Value, index: number) => Option<FilterValue>
) {
  for (const [value, index] of enumerate(iterator)) {
    const newValue = f(value, index);
    if (newValue === None) continue;
    return newValue;
  }
}

export function filterMap<FilterValue, Value>(
  iterator: IteratorObject<Value, undefined, unknown>,
  f: (value: Value, index: number) => Option<FilterValue>
) {
  const generator = function* () {
    for (const [value, index] of enumerate(iterator)) {
      const newValue = f(value as Value, index);
      if (newValue === None) continue;
      yield newValue;
    }
    return undefined;
  };

  return fromIterator(generator());
}

export function collect<Value>(
  iterator: IteratorObject<Value, undefined, unknown>
): Array<Value> {
  return iterator.toArray();
}

type Extensions<Value> = {
  filterMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Iterup<FilterValue>;

  findMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): FilterValue | undefined;

  enumerate(): Iterup<[Value, number]>;

  collect(): Array<Value>;
  toArray(): Array<Value>;
};

const Extensions = {
  [filterMap.name]: filterMap,
  [findMap.name]: findMap,
  [collect.name]: collect,
  [enumerate.name]: enumerate,
} as const;

type Overrides<Value> = {
  map: <MapValue>(
    f: (value: Value, index: number) => MapValue
  ) => Iterup<MapValue>;
  filter: <FilterValue extends Value>(
    f: (value: Value, index: number) => value is FilterValue
  ) => Iterup<FilterValue>;
  flatMap: <MapValue>(
    f: (
      value: Value,
      index: number
    ) =>
      | Iterable<MapValue, unknown, undefined>
      | Iterator<MapValue, unknown, undefined>
  ) => Iterup<MapValue>;
};
type OverrideFunctions<Value> = keyof Overrides<Value>;
const OverrideFunctions = new Set<OverrideFunctions<{}>>([
  "map",
  "filter",
  "flatMap",
]);

type Excludes<Value> = OverrideFunctions<Value> | "toArray";

export function isIterator<Value>(
  value: unknown
): value is IteratorObject<Value, undefined, unknown> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.iterator in value && typeof value[Symbol.iterator] === "function"
  );
}

export function isIterup<Value>(
  value: IteratorObject<Value, undefined, unknown>
): value is Iterup<Value> {
  return IterupID in value;
}

function fromIterator<Value>(
  iterator: IteratorObject<Value, undefined, unknown>
): Iterup<Value> {
  const proxy = new Proxy(iterator, {
    get(target, prop, receiver) {
      const extension = Extensions[prop as keyof typeof Extensions];
      if (extension) {
        return function (...args: any[]) {
          return extension.apply(null, [target, ...args] as any);
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
