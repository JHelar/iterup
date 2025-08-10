import { BaseAsyncIterator, BaseIterator, None, type Option } from "./core";
import { isAsyncIterator, isIterable, isIterator, unwrapResult } from "./utils";

/**
 * Yields pairs [value, index] for each element. Index starts at 0.
 *
 * @template Value
 * @param iterator - Source iterator
 * @returns Async iterator of [value, index]
 *
 * @example
 * ```ts
 * const result = await iterup(['a', 'b', 'c'])
 *   .enumerate()
 *   .collect();
 * // result: [['a', 0], ['b', 1], ['c', 2]]
 * ```
 */
export async function* enumerate<Value>(
  iterator: BaseIterator<Value>
): BaseAsyncIterator<[Value, number]> {
  let index = 0;
  for await (const value of iterator) {
    yield [value, index++] as [Value, number];
  }
  return;
}

/**
 * Finds the first value for which the provided function returns a non-None value.
 * Returns the transformed value if found, undefined if none match.
 *
 * @template FilterValue - The type of the transformed value
 * @template Value - The type of values in the input iterator
 * @param iterator - The iterator to search through
 * @param f - Function that transforms values, returning None to skip or a value to return
 * @returns Promise resolving to the first transformed value or undefined if none found
 *
 * @example
 * ```ts
 * const result = await findMap(
 *   iterup([1, 2, 3, 4, 5]),
 *   x => x > 3 ? x * 2 : None
 * );
 * // result: 8 (first value > 3 is 4, transformed to 8)
 * ```
 */
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

/**
 * Transforms and filters values in a single operation. Values that transform
 * to None are filtered out, while others are transformed and kept.
 *
 * @template FilterValue - The type of the transformed values
 * @template Value - The type of values in the input iterator
 * @param iterator - The iterator to filter and transform
 * @param f - Function that transforms values; return None to filter out (async supported)
 * @returns Async iterator of transformed, non-None values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .filterMap(x => x % 2 === 0 ? x * 2 : None)
 *   .collect();
 * // result: [4, 8] (even numbers doubled)
 * ```
 */
export async function* filterMap<FilterValue, Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => Option<FilterValue> | Promise<FilterValue>
): BaseAsyncIterator<FilterValue> {
  for await (const value of iterator) {
    let newValue = f(value);
    if (newValue instanceof Promise) {
      newValue = await newValue;
    }

    if (newValue === None) continue;
    yield newValue;
  }
  return;
}

/**
 * Transforms each value in the iterator using the provided function.
 * Supports async transformation functions.
 *
 * @template Value - The type of values in the input iterator
 * @template MapValue - The type of values after transformation
 * @param iterator - The iterator to transform
 * @param f - Function to transform each value (async supported)
 * @returns Async iterator of transformed values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3])
 *   .map(x => x * 2)
 *   .collect();
 * // result: [2, 4, 6]
 * ```
 */
export async function* map<Value, MapValue>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => MapValue | Promise<MapValue>
): BaseAsyncIterator<MapValue> {
  for await (const value of iterator) {
    let newValue = f(value);
    if (newValue instanceof Promise) {
      newValue = await newValue;
    }
    yield newValue;
  }
  return;
}

/**
 * Transforms each value into an iterator and flattens the results.
 * Supports async transformation functions.
 *
 * @template Value - The type of values in the input iterator
 * @template MapValue - The type of values in the resulting flattened iterator
 * @param iterator - The iterator to transform and flatten
 * @param f - Function that transforms each value into an iterator (async supported)
 * @returns Async iterator of flattened transformed values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3])
 *   .flatMap(x => [x, x * 2])
 *   .collect();
 * // result: [1, 2, 2, 4, 3, 6]
 * ```
 */
export async function* flatMap<Value, MapValue>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => BaseIterator<MapValue> | Promise<BaseIterator<MapValue>>
): BaseAsyncIterator<MapValue> {
  for await (const value of iterator) {
    let newValues = f(value);
    if (newValues instanceof Promise) {
      newValues = await newValues;
    }

    yield* newValues;
  }
  return;
}

/**
 * Skips the first n values from the iterator and yields the rest.
 * If count <= 0, yields the original sequence unchanged.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to drop values from
 * @param count - Number of values to skip from the beginning
 * @returns Async iterator with the first count values skipped
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .drop(2)
 *   .collect();
 * // result: [3, 4, 5]
 * ```
 */
export async function* drop<Value>(
  iterator: BaseIterator<Value>,
  count: number
): BaseAsyncIterator<Value> {
  if (count <= 0) {
    yield* iterator;
    return;
  }

  for await (const value of iterator) {
    if (count-- > 0) continue;
    yield value;
  }

  return;
}

/**
 * Takes only the first n values from the iterator and stops.
 * If count <= 0, yields an empty sequence.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to take values from
 * @param count - Maximum number of values to take
 * @returns Async iterator with at most count values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .take(3)
 *   .collect();
 * // result: [1, 2, 3]
 * ```
 */
export async function* take<Value>(
  iterator: BaseIterator<Value>,
  count: number
): BaseAsyncIterator<Value> {
  if (count <= 0) {
    return Iterator.from([]);
  }

  for await (const value of iterator) {
    yield value;
    if (count-- <= 1) break;
  }
}

/**
 * Finds the first value that satisfies the predicate function.
 * Supports async predicates.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to search through
 * @param f - Predicate function to test each value (async supported)
 * @returns Promise resolving to the first matching value or undefined
 *
 * @example
 * ```ts
 * const result = await filter(
 *   iterup([1, 2, 3, 4, 5]),
 *   x => x > 3
 * );
 * // result: 4
 * ```
 */
export async function filter<Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => boolean | Promise<boolean>
): Promise<Value | undefined> {
  for await (const value of iterator) {
    if (await f(value)) {
      return value;
    }
  }
}

/**
 * Collects all values from the iterator into an array.
 * This consumes the entire iterator and returns all values as an array.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to collect values from
 * @returns Promise resolving to an array containing all yielded values
 *
 * @example
 * ```ts
 * const result = await collect(iterup([1, 2, 3]));
 * // result: [1, 2, 3]
 * ```
 */
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

/**
 * Configuration object for creating numeric ranges.
 * Defines the start point and optional end point (both inclusive).
 */
export type RangeArgument = {
  /** Starting number of the range (inclusive, default: 0) */
  from?: number;
  /** Ending number of the range (inclusive, default: Number.MAX_SAFE_INTEGER) */
  to?: number;
};

/**
 * Creates an iterator that yields a sequence of numbers within a specified range.
 * Both start and end points are inclusive.
 *
 * @param options - Range parameters
 * @param options.from - Starting number (inclusive, default: 0)
 * @param options.to - Ending number (inclusive, default: Number.MAX_SAFE_INTEGER)
 * @returns Async iterator yielding numbers in the specified range
 *
 * @example
 * ```ts
 * // Basic range from 0 to 5 (inclusive)
 * const basic = await range({ from: 0, to: 5 }).collect();
 * // result: [0, 1, 2, 3, 4, 5]
 *
 * // Infinite range (use with take() to avoid infinite loops)
 * const infinite = range({ from: 10 });
 * const first5 = await infinite.take(5).collect();
 * // result: [10, 11, 12, 13, 14]
 * ```
 */
export async function* range({
  from = 0,
  to = Number.MAX_SAFE_INTEGER,
}: RangeArgument): BaseAsyncIterator<number> {
  if (from > to) {
    return Iterator.from([]);
  }

  for (let count = from; count <= to; count++) {
    yield count;
  }
}

/**
 * Calculates the sum of all numeric values in the iterator.
 * This method is only available for numeric iterators.
 *
 * @template Value - The numeric type of values in the iterator (must extend number)
 * @param iterator - The iterator containing numeric values to sum
 * @returns Promise resolving to the total sum
 * @throws {TypeError} If the iterator contains non-numeric values
 *
 * @example
 * ```ts
 * const total = await iterup([1, 2, 3, 4, 5]).sum();
 * // result: 15
 * ```
 */
export async function sum<Value extends number>(
  iterator: BaseIterator<Value>
): Promise<number> {
  return fold(iterator, 0, (sum, value) => {
    if (typeof value !== "number")
      throw new TypeError("sum is not supported for non numeric iterators");

    return sum + value;
  });
}

/**
 * Finds the minimum value among all numeric values in the iterator.
 * This method is only available for numeric iterators.
 *
 * @template Value - The numeric type of values in the iterator (must extend number)
 * @param iterator - The iterator containing numeric values to compare
 * @returns Promise resolving to the smallest value found
 * @throws {TypeError} If the iterator contains non-numeric values
 *
 * @example
 * ```ts
 * const minimum = await iterup([5, 2, 8, 1, 9]).min();
 * // result: 1
 * ```
 */
export async function min<Value extends number>(
  iterator: BaseIterator<Value>
): Promise<number> {
  return fold(iterator, Number.MAX_SAFE_INTEGER, (min, value) => {
    if (typeof value !== "number")
      throw new TypeError("min is not supported for non numeric iterators");

    if (value < min) return value;
    return min;
  });
}

/**
 * Finds the maximum value among all numeric values in the iterator.
 * This method is only available for numeric iterators.
 *
 * @template Value - The numeric type of values in the iterator (must extend number)
 * @param iterator - The iterator containing numeric values to compare
 * @returns Promise resolving to the largest value found
 * @throws {TypeError} If the iterator contains non-numeric values
 *
 * @example
 * ```ts
 * const maximum = await iterup([5, 2, 8, 1, 9]).max();
 * // result: 9
 * ```
 */
export async function max<Value extends number>(
  iterator: BaseIterator<Value>
): Promise<number> {
  return fold(iterator, Number.MIN_SAFE_INTEGER, (max, value) => {
    if (typeof value !== "number")
      throw new TypeError("max is not supported for non numeric iterators");

    if (value > max) return value;
    return max;
  });
}

/**
 * Repeats the values from the iterator for a specified number of cycles.
 * The input is consumed and cached during the first cycle; subsequent cycles
 * replay the cached values. Defaults to infinite cycles.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator whose values should be cycled
 * @param cycles - Number of times to repeat the sequence (default: Infinity)
 * @returns Async iterator that yields the original values repeatedly
 *
 * @example
 * ```ts
 * // Cycle through values 3 times
 * const result = await iterup([1, 2, 3])
 *   .cycle(3)
 *   .collect();
 * // result: [1, 2, 3, 1, 2, 3, 1, 2, 3]
 * ```
 */
export async function* cycle<Value>(
  iterator: BaseIterator<Value>,
  cycles = Infinity
): BaseAsyncIterator<Value> {
  if (cycles <= 0) {
    return;
  }

  const cachedValues: Value[] = [];
  let initialCycle = true;
  for (let cycle = 0; cycle < cycles; cycle++) {
    initialCycle = cycle === 0;

    for await (const value of initialCycle ? iterator : cachedValues) {
      yield value;
      if (initialCycle) {
        cachedValues.push(value);
      }
    }
  }
}

/**
 * Combines two iterators element-wise, yielding pairs until one is exhausted.
 * The resulting iterator stops when the shorter of the two inputs completes.
 *
 * @template Value - The type of values in the first iterator
 * @template AnotherValue - The type of values in the second iterator
 * @param iterator - The first iterator to zip
 * @param anotherIterator - The second iterator to zip
 * @returns Async iterator of [Value, AnotherValue]
 *
 * @example
 * ```ts
 * const result = await zip([1, 2, 3], ['a', 'b', 'c']).collect();
 * // result: [[1, 'a'], [2, 'b'], [3, 'c']]
 * ```
 */
export async function* zip<Value, AnotherValue>(
  iterator: BaseIterator<Value>,
  anotherIterator: BaseIterator<AnotherValue>
): BaseAsyncIterator<[Value, AnotherValue]> {
  if (isIterable(iterator)) {
    iterator = Iterator.from(iterator);
  }

  if (isIterable(anotherIterator)) {
    anotherIterator = Iterator.from(anotherIterator);
  }

  for (;;) {
    const [oneResult, anotherResult] = await Promise.all([
      (iterator as BaseAsyncIterator<Value>).next(),
      (anotherIterator as BaseAsyncIterator<AnotherValue>).next(),
    ]);

    const oneValue = unwrapResult(oneResult);
    if (oneValue === None) break;

    const anotherValue = unwrapResult(anotherResult);
    if (anotherValue === None) break;

    yield [oneValue, anotherValue] as [Value, AnotherValue];
  }
  return;
}

/**
 * Applies a function to each element and an accumulator, returning the final value.
 * This is a fundamental operation for building other aggregation functions.
 *
 * @template Value - The type of values in the iterator
 * @template NewValue - The type of the accumulator and return value
 * @param iterator - The iterator to fold over
 * @param initialValue - The initial value for the accumulator
 * @param f - Function that takes (accumulator, value) and returns the new accumulator
 * @returns Promise resolving to the final accumulated value
 *
 * @example
 * ```ts
 * // Sum using fold
 * const sum = await fold([1, 2, 3, 4], 0, (acc, val) => acc + val);
 * // result: 10
 *
 * // Build a string
 * const sentence = await fold(['Hello', 'world'], '', (acc, word) =>
 *   acc === '' ? word : `${acc} ${word}`
 * );
 * // result: "Hello world"
 * ```
 */
export async function fold<Value, NewValue>(
  iterator: BaseIterator<Value>,
  initialValue: NewValue,
  f: (accumulator: NewValue, value: Value) => NewValue | Promise<NewValue>
): Promise<NewValue> {
  let accumulator = initialValue;
  for await (const value of iterator) {
    accumulator = await f(accumulator, value);
  }

  return accumulator;
}

/**
 * Reduces the iterator to a single value using the provided function.
 * Unlike fold, reduce uses the first element as the initial accumulator value.
 * Returns undefined if the iterator is empty.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to reduce
 * @param f - Function that takes (accumulator, value) and returns the new accumulator
 * @returns Promise resolving to the reduced value or undefined if empty
 *
 * @example
 * ```ts
 * // Sum using reduce
 * const sum = await reduce([1, 2, 3, 4], (acc, val) => acc + val);
 * // result: 10
 *
 * // Find maximum
 * const max = await reduce([5, 2, 8, 1, 9], (acc, val) => acc > val ? acc : val);
 * // result: 9
 * ```
 */
export async function reduce<Value>(
  iterator: BaseIterator<Value>,
  f: (accumulator: Value, value: Value) => Value | Promise<Value>
): Promise<Value | undefined> {
  if (isIterable(iterator)) {
    iterator = Iterator.from(iterator);
  }

  const firstResult = unwrapResult(
    await (iterator as BaseAsyncIterator<Value>).next()
  );
  if (firstResult === None) {
    return undefined;
  }

  return fold(iterator, firstResult, f);
}

/**
 * Executes a function for each element in the iterator, primarily for side effects.
 * This consumes the entire iterator and returns void.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to iterate over
 * @param f - Function to execute for each value (can be async; not awaited)
 * @returns Promise that resolves when all elements have been iterated
 *
 * @example
 * ```ts
 * // Log each element
 * await forEach([1, 2, 3], (value) => {
 *   console.log(`Processing: ${value}`);
 * });
 * // Logs: "Processing: 1", "Processing: 2", "Processing: 3"
 * ```
 */
export async function forEach<Value>(
  iterator: BaseIterator<Value>,
  f: (value: Value) => void | Promise<void>
): Promise<void> {
  await fold(iterator, undefined, async (_, value) => {
    await f(value);
    return undefined;
  });
}
