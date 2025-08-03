import {
  BaseIterator,
  fromAsyncIterator,
  iterup,
  None,
  type Iterup,
  type Option,
} from "./core";
import { isAsyncIterator, isIterator } from "./utils";

export function enumerate<Value>(
  iterator: BaseIterator<Value>
): Iterup<[Value, number]> {
  const generator = async function* () {
    let index = 0;
    for await (const value of iterator) {
      yield [value, index++] as [Value, number];
    }
  };

  return fromAsyncIterator(generator());
}

export async function findMap<FilterValue, Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => Option<FilterValue> | Promise<Option<FilterValue>>
): Promise<FilterValue | undefined> {
  for await (const value of iterator) {
    let newValue = f(value);
    if (newValue instanceof Promise) {
      newValue = await newValue;
    }

    if (newValue === None) continue;
    return newValue;
  }
}

export function filterMap<FilterValue, Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => Option<FilterValue> | Promise<FilterValue>
): Iterup<FilterValue> {
  const generator = async function* () {
    for await (const value of iterator) {
      let newValue = f(value);
      if (newValue instanceof Promise) {
        newValue = await newValue;
      }

      if (newValue === None) continue;
      yield newValue;
    }
  };

  return fromAsyncIterator(generator());
}

export function map<Value, MapValue>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => MapValue | Promise<MapValue>
): Iterup<MapValue> {
  const generator = async function* () {
    for await (const value of iterator) {
      let newValue = f(value);
      if (newValue instanceof Promise) {
        newValue = await newValue;
      }
      yield newValue;
    }
  };

  return fromAsyncIterator(generator());
}

export function flatMap<Value, MapValue>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => BaseIterator<MapValue> | Promise<BaseIterator<MapValue>>
): Iterup<MapValue> {
  const generator = async function* () {
    for await (const value of iterator) {
      let newValues = f(value);
      if (newValues instanceof Promise) {
        newValues = await newValues;
      }

      yield* newValues;
    }
  };

  return fromAsyncIterator(generator());
}

export function drop<Value>(
  iterator: BaseIterator<Value>,
  count: number
): Iterup<Value> {
  if (count <= 0) {
    return iterup(iterator);
  }

  const generator = async function* () {
    for await (const value of iterator) {
      if (count-- > 0) continue;
      yield value;
    }
  };

  return fromAsyncIterator(generator());
}

export function take<Value>(
  iterator: BaseIterator<Value>,
  count: number
): Iterup<Value> {
  if (count <= 0) {
    return iterup([]);
  }

  const generator = async function* () {
    for await (const value of iterator) {
      yield value;
      if (count-- <= 1) break;
    }
  };

  return fromAsyncIterator(generator());
}

export async function filter<Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => boolean | Promise<boolean>
): Promise<Value | undefined> {
  for await (const value of iterator) {
    if (f(value)) {
      return value;
    }
  }
}

export async function collect<Value>(
  iterator: BaseIterator<Value>
): Promise<Array<Value>> {
  if (isAsyncIterator(iterator) || isIterator(iterator)) {
    const result: Value[] = [];
    for await (const value of iterator) {
      result.push(value);
    }
    return result;
  }
  return Array.from(iterator);
}
