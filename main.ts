export const None: unique symbol = Symbol("None");
type None = typeof None;

type Option<T> = None | T;

type MapFunction<Value, FilterValue> = (
  value: Value,
  index: number
) => Option<FilterValue>;

type OverridenFunctions = "toArray";

type Iterup<Value> = Omit<ArrayIterator<Value>, OverridenFunctions> & {
  filterMap<FilterValue>(
    f: MapFunction<Value, FilterValue>
  ): Iterup<FilterValue>;

  filterFind<FilterValue>(
    f: MapFunction<Value, FilterValue>
  ): FilterValue | undefined;

  collect(): Array<Value>;
  toArray(): Array<Value>;
};

function filterFind<FilterValue, Value>(
  this: ArrayIterator<Value>,
  f: (value: Value, index: number) => Option<FilterValue>
) {
  let index = -1;
  for (const value of this) {
    const newValue = f(value, index++);
    if (newValue === None) continue;
    return newValue;
  }
}

function filterMap<FilterValue, Value>(
  this: ArrayIterator<Value>,
  f: (value: Value, index: number) => Option<FilterValue>
) {
  const generator = function* (iterator: ArrayIterator<Value>) {
    let index = -1;
    for (const value of iterator) {
      const newValue = f(value, index++);
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

function fromIterator<Value>(iterator: ArrayIterator<Value>): Iterup<Value> {
  const proxy = new Proxy(iterator, {
    get(target, prop) {
      if (prop === filterMap.name) {
        return function (...args: Parameters<typeof filterMap>) {
          return filterMap.apply(target, args);
        };
      }

      if (prop === filterFind.name) {
        return function (...args: Parameters<typeof filterFind>) {
          return filterFind.apply(target, args);
        };
      }

      if (prop === collect.name) {
        return function (...args: Parameters<typeof collect>) {
          return collect.apply(target, args);
        };
      }

      if (prop === "toArray") {
        return function (...args: Parameters<typeof collect>) {
          return collect.apply(target, args);
        };
      }

      const value = target[prop];
      if (value instanceof Function) {
        return function (...args) {
          const func = value.apply(target, args);
          if (prop === "map") {
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
