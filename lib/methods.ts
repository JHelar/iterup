import {
  BaseIterator,
  fromAsyncIterator,
  iterup,
  None,
  type Iterup,
  type Option,
} from "./core";
import { isAsyncIterator, isIterator } from "./utils";

/**
 * Creates an iterator that yields pairs of [value, index] for each element.
 * The index starts at 0 and increments with each iteration.
 *
 * @template Value - The type of values in the input iterator
 * @param iterator - The iterator to enumerate
 * @returns An Iterup yielding [value, index] tuples
 *
 * @example
 * ```ts
 * const result = await iterup(['a', 'b', 'c'])
 *   .enumerate()
 *   .collect();
 * // result: [['a', 0], ['b', 1], ['c', 2]]
 * ```
 */
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

/**
 * Finds the first value for which the provided function returns a non-None value.
 * Similar to Array.find() but with transformation capabilities.
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
 * @param f - Function that transforms values, returning None to filter out
 * @returns An Iterup with transformed and filtered values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .filterMap(x => x % 2 === 0 ? x * 2 : None)
 *   .collect();
 * // result: [4, 8] (even numbers doubled)
 * ```
 */
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

/**
 * Transforms each value in the iterator using the provided function.
 * Similar to Array.map() but for iterators and supports async functions.
 *
 * @template Value - The type of values in the input iterator
 * @template MapValue - The type of values after transformation
 * @param iterator - The iterator to transform
 * @param f - Function to transform each value
 * @returns An Iterup with transformed values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3])
 *   .map(x => x * 2)
 *   .collect();
 * // result: [2, 4, 6]
 * ```
 */
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

/**
 * Transforms each value into an iterator and flattens the results.
 * Similar to Array.flatMap() but for iterators and supports async functions.
 *
 * @template Value - The type of values in the input iterator
 * @template MapValue - The type of values in the resulting flattened iterator
 * @param iterator - The iterator to transform and flatten
 * @param f - Function that transforms each value into an iterator
 * @returns An Iterup with flattened transformed values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3])
 *   .flatMap(x => [x, x * 2])
 *   .collect();
 * // result: [1, 2, 2, 4, 3, 6]
 * ```
 */
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

/**
 * Skips the first n values from the iterator and returns the rest.
 * If count is 0 or negative, returns the original iterator unchanged.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to drop values from
 * @param count - Number of values to skip from the beginning
 * @returns An Iterup with the first count values skipped
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .drop(2)
 *   .collect();
 * // result: [3, 4, 5]
 * ```
 */
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

/**
 * Takes only the first n values from the iterator and stops.
 * If count is 0 or negative, returns an empty iterator.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to take values from
 * @param count - Maximum number of values to take
 * @returns An Iterup with at most count values
 *
 * @example
 * ```ts
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .take(3)
 *   .collect();
 * // result: [1, 2, 3]
 * ```
 */
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

/**
 * Finds the first value that satisfies the predicate function.
 * Similar to Array.find() but for iterators and supports async predicates.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator to search through
 * @param f - Predicate function to test each value
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
    if (f(value)) {
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
 * @returns Promise resolving to an array containing all values
 *
 * @example
 * ```ts
 * const result = await collect(iterup([1, 2, 3]));
 * // result: [1, 2, 3]
 *
 * // Often used at the end of a chain
 * const processed = await iterup([1, 2, 3, 4, 5])
 *   .map(x => x * 2)
 *   .filter(x => x > 5)
 *   .collect();
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
 * Provides a convenient way to generate numeric sequences without pre-allocating arrays.
 * Both start and end points are inclusive.
 *
 * @param options - Configuration object specifying the range parameters
 * @param options.from - Starting number (inclusive, default: 0)
 * @param options.to - Ending number (inclusive, default: Number.MAX_SAFE_INTEGER)
 * @returns An Iterup yielding numbers in the specified range
 *
 * @example
 * ```ts
 * // Basic range from 0 to 5 (inclusive)
 * const basic = await range({ from: 0, to: 5 }).collect();
 * // result: [0, 1, 2, 3, 4, 5]
 *
 * // Range from 1 to 3 (inclusive)
 * const simple = await range({ from: 1, to: 3 }).collect();
 * // result: [1, 2, 3]
 *
 * // Range starting from 0 (using default from)
 * const fromZero = await range({ to: 3 }).collect();
 * // result: [0, 1, 2, 3]
 *
 * // Infinite range (be careful with collect()!)
 * const infinite = range({ from: 10 }); // 10, 11, 12, ...
 * const first5 = await infinite.take(5).collect();
 * // result: [10, 11, 12, 13, 14]
 *
 * // Used with iterup() overload
 * const shorthand = await iterup({ from: 0, to: 3 }).collect();
 * // result: [0, 1, 2, 3]
 * ```
 */
export function range({
  from = 0,
  to = Number.MAX_SAFE_INTEGER,
}: RangeArgument): Iterup<number> {
  if (from > to) return iterup([]);

  const generator = async function* () {
    for (let count = from; count <= to; count++) {
      yield count;
    }
  };

  return fromAsyncIterator(generator());
}

/**
 * Calculates the sum of all numeric values in the iterator.
 * This method is only available for Iterup instances that contain numbers.
 *
 * @template Value - The numeric type of values in the iterator (must extend number)
 * @param iterator - The iterator containing numeric values to sum
 * @returns Promise resolving to the total sum of all values
 * @throws {TypeError} If the iterator contains non-numeric values
 *
 * @example
 * ```ts
 * // Sum an array of numbers
 * const total = await iterup([1, 2, 3, 4, 5]).sum();
 * // result: 15
 *
 * // Sum after filtering and mapping
 * const evenSum = await iterup([1, 2, 3, 4, 5, 6])
 *   .filterMap(n => n % 2 === 0 ? n : None)
 *   .sum();
 * // result: 12 (2 + 4 + 6)
 *
 * // Sum a range
 * const rangeSum = await iterup({ from: 1, to: 6 }).sum();
 * // result: 15 (1 + 2 + 3 + 4 + 5)
 *
 * // Sum with transformations
 * const squaredSum = await iterup([1, 2, 3])
 *   .map(n => n * n)
 *   .sum();
 * // result: 14 (1² + 2² + 3²)
 * ```
 */
export async function sum<Value extends number>(
  iterator: BaseIterator<Value>
): Promise<number> {
  let sum = 0;
  for await (const value of iterator) {
    if (typeof value !== "number")
      throw new TypeError("sum is not supported for non numeric iterators");

    sum += value;
  }
  return sum;
}

/**
 * Finds the minimum value among all numeric values in the iterator.
 * This method is only available for Iterup instances that contain numbers.
 *
 * @template Value - The numeric type of values in the iterator (must extend number)
 * @param iterator - The iterator containing numeric values to compare
 * @returns Promise resolving to the smallest value found
 * @throws {TypeError} If the iterator contains non-numeric values
 *
 * @example
 * ```ts
 * // Find minimum in an array
 * const minimum = await iterup([5, 2, 8, 1, 9]).min();
 * // result: 1
 *
 * // Find minimum after filtering
 * const minEven = await iterup([1, 2, 3, 4, 5, 6])
 *   .filterMap(n => n % 2 === 0 ? n : None)
 *   .min();
 * // result: 2
 *
 * // Find minimum in a range
 * const rangeMin = await iterup({ from: 10, to: 20 }).min();
 * // result: 10
 *
 * // Find minimum after transformations
 * const transformedMin = await iterup([1, 2, 3, 4])
 *   .map(n => n * n)
 *   .min();
 * // result: 1 (1²)
 *
 * // Combine with other operations
 * const processedMin = await iterup({ from: 1, to: 10 })
 *   .filterMap(n => n % 3 === 0 ? n * 2 : None)
 *   .min();
 * // result: 6 (3 * 2, smallest multiple of 3 doubled)
 * ```
 */
export async function min<Value extends number>(
  iterator: BaseIterator<Value>
): Promise<number> {
  let min = Number.MAX_SAFE_INTEGER;
  for await (const value of iterator) {
    if (typeof value !== "number")
      throw new TypeError("min is not supported for non numeric iterators");

    if (value < min) {
      min = value;
    }
  }
  return min;
}

/**
 * Finds the maximum value among all numeric values in the iterator.
 * This method is only available for Iterup instances that contain numbers.
 *
 * @template Value - The numeric type of values in the iterator (must extend number)
 * @param iterator - The iterator containing numeric values to compare
 * @returns Promise resolving to the largest value found
 * @throws {TypeError} If the iterator contains non-numeric values
 *
 * @example
 * ```ts
 * // Find maximum in an array
 * const maximum = await iterup([5, 2, 8, 1, 9]).max();
 * // result: 9
 *
 * // Find maximum after filtering
 * const maxEven = await iterup([1, 2, 3, 4, 5, 6])
 *   .filterMap(n => n % 2 === 0 ? n : None)
 *   .max();
 * // result: 6
 *
 * // Find maximum in a range
 * const rangeMax = await iterup({ from: 10, to: 20 }).max();
 * // result: 20
 *
 * // Find maximum after transformations
 * const transformedMax = await iterup([1, 2, 3, 4])
 *   .map(n => n * n)
 *   .max();
 * // result: 16 (4²)
 *
 * // Combine with other operations
 * const processedMax = await iterup({ from: 1, to: 10 })
 *   .filterMap(n => n % 3 === 0 ? n * 2 : None)
 *   .max();
 * // result: 18 (9 * 2, largest multiple of 3 doubled)
 * ```
 */
export async function max<Value extends number>(
  iterator: BaseIterator<Value>
): Promise<number> {
  let max = Number.MIN_SAFE_INTEGER;
  for await (const value of iterator) {
    if (typeof value !== "number")
      throw new TypeError("max is not supported for non numeric iterators");

    if (value > max) {
      max = value;
    }
  }
  return max;
}

/**
 * Repeats the values from the iterator for a specified number of cycles.
 * The input iterator is fully consumed and cached, then the values are yielded
 * repeatedly for the specified number of cycles. Defaults to infinite cycles.
 *
 * @template Value - The type of values in the iterator
 * @param iterator - The iterator whose values should be cycled
 * @param cycles - Number of times to repeat the sequence (default: Infinity for infinite cycling)
 * @returns An Iterup that yields the original values repeatedly
 *
 * @example
 * ```ts
 * // Cycle through values 3 times
 * const result = await iterup([1, 2, 3])
 *   .cycle(3)
 *   .collect();
 * // result: [1, 2, 3, 1, 2, 3, 1, 2, 3]
 *
 * // Infinite cycling (use with take() to avoid infinite loops)
 * const infinite = await iterup(['A', 'B', 'C'])
 *   .cycle()
 *   .take(7)
 *   .collect();
 * // result: ['A', 'B', 'C', 'A', 'B', 'C', 'A']
 *
 * // Cycle with transformations
 * const pattern = await iterup([1, 2])
 *   .cycle(2)
 *   .map(n => n * 10)
 *   .collect();
 * // result: [10, 20, 10, 20]
 *
 * // Use with ranges
 * const repeatedRange = await iterup({ from: 1, to: 4 })
 *   .cycle(2)
 *   .collect();
 * // result: [1, 2, 3, 1, 2, 3]
 *
 * // Common pattern: cycling through options
 * const colors = ['red', 'green', 'blue'];
 * const colorCycle = iterup(colors).cycle();
 * const assignments = await iterup(['item1', 'item2', 'item3', 'item4', 'item5'])
 *   .enumerate()
 *   .map(async ([item, index]) => {
 *     const colorIterator = colorCycle.drop(index).take(1);
 *     const color = (await colorIterator.collect())[0];
 *     return { item, color };
 *   })
 *   .collect();
 * ```
 */
export function cycle<Value>(
  iterator: BaseIterator<Value>,
  cycles = Infinity
): Iterup<Value> {
  const generator = async function* () {
    const values = await collect(iterator);
    for (let cycle = 0; cycle < cycles; cycle++) {
      for await (const value of values) {
        yield value;
      }
    }
  };

  return fromAsyncIterator(generator());
}
