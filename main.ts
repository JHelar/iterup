export const None: unique symbol = Symbol("None");
type None = typeof None;

type Option<T> = None | T;

type MapFunction<Value, FilterValue> = (
  value: Value,
  index: number
) => Option<FilterValue>;

type Iterup<Value> = Omit<ArrayIterator<Value>, Excludes> & {
  [K in Overrides]: (
    ...args: Parameters<ArrayIterator<Value>[K]>
  ) => Iterup<Value>;
} & {
  filterMap<FilterValue>(
    f: MapFunction<Value, FilterValue>
  ): Iterup<FilterValue>;

  filterFind<FilterValue>(
    f: MapFunction<Value, FilterValue>
  ): FilterValue | undefined;

  enumerate(): Iterup<[Value, number]>;

  collect(): Array<Value>;
  toArray(): Array<Value>;
};

function enumerate<Value>(this: ArrayIterator<Value>) {
  const generator = function* (iterator: ArrayIterator<Value>) {
    let index = 0;
    for (const value of iterator) {
      yield [value, index++] as [Value, number];
    }
  };

  return fromIterator(generator(this) as ArrayIterator<[Value, number]>);
}

function filterFind<FilterValue, Value>(
  this: ArrayIterator<Value>,
  f: (value: Value, index: number) => Option<FilterValue>
) {
  for (const [value, index] of enumerate.apply(this)) {
    const newValue = f(value as Value, index);
    if (newValue === None) continue;
    return newValue;
  }
}

function filterMap<FilterValue, Value>(
  this: ArrayIterator<Value>,
  f: (value: Value, index: number) => Option<FilterValue>
) {
  const generator = function* (iterator: ArrayIterator<Value>) {
    for (const [value, index] of enumerate.apply(iterator)) {
      const newValue = f(value as Value, index);
      if (newValue === None) continue;
      yield newValue;
    }
  };

  return fromIterator(generator(this) as ArrayIterator<[number, FilterValue]>);
}

function collect<Value>(this: ArrayIterator<Value>): Array<Value> {
  const array: Array<Value> = [];

  for (const value of this) {
    array.push(value);
  }

  return array;
}

const Extensions = {
  [filterMap.name]: filterMap,
  [filterFind.name]: filterFind,
  [collect.name]: collect,
  [enumerate.name]: enumerate,
  toArray: collect,
} as const;

const Overrides = new Set(["map"] as const);
type Overrides = typeof Overrides extends Set<infer O> ? O : never;
type Excludes = Overrides | "toArray";

function isIterator<Value>(value: unknown): value is ArrayIterator<Value> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.iterator in value && typeof value[Symbol.iterator] === "function"
  );
}

function fromIterator<Value>(iterator: ArrayIterator<Value>): Iterup<Value> {
  const proxy = new Proxy(iterator, {
    get(target, prop) {
      if (prop in Extensions) {
        const extensionKey = prop as keyof typeof Extensions;
        return function (...args: Parameters<typeof filterMap>) {
          return Extensions[extensionKey]?.apply(target, args);
        };
      }

      const value = target[prop as keyof typeof target];
      if (value instanceof Function) {
        return function (...args: any[]) {
          const func = value.apply(target, args);
          if (Overrides.has(prop as Overrides) && isIterator(func)) {
            return fromIterator(func);
          }
          return func;
        };
      }
      return value;
    },
  });

  return proxy as Iterup<Value>;
}

function fromArray<Value>(array: Array<Value>): Iterup<Value> {
  const iterator = function* () {
    for (const value of array) {
      yield value;
    }
  };
  return fromIterator(iterator() as ArrayIterator<Value>);
}

export function iterup<Value>(collection: Array<Value>): Iterup<Value> {
  return fromArray(collection);
}
