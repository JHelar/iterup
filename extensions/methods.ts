import { fromIterator, None, type Option } from "../core";
import { isIterator } from "../utils";

export function enumerate<Value>(
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>
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
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>,
  f: (value: Value, index: number) => Option<FilterValue>
) {
  for (const [value, index] of enumerate(iterator)) {
    const newValue = f(value, index);
    if (newValue === None) continue;
    return newValue;
  }
}

export function filterMap<FilterValue, Value>(
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>,
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
  iterator: Iterable<Value> | IteratorObject<Value, undefined, unknown>
): Array<Value> {
  if (isIterator(iterator)) {
    return iterator.toArray();
  }
  return Array.from(iterator);
}
