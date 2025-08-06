/**
 * Extension methods and type definitions for the Iterup interface.
 *
 * This module defines the extension methods that are dynamically added to
 * Iterup instances, providing a fluent interface for iterator operations.
 * The Extensions type defines the method signatures, while the Extensions
 * object maps method names to their implementations from the methods module.
 */

import type { BaseIterator, Iterup, None, Option } from "./core";
import {
  collect,
  cycle,
  drop,
  enumerate,
  filter,
  filterMap,
  findMap,
  flatMap,
  fold,
  forEach,
  map,
  max,
  min,
  reduce,
  sum,
  take,
  zip,
} from "./methods";

/**
 * Function type for filtering and transforming values in filterMap operations.
 * Returns None to filter out values, or a transformed value to keep them.
 *
 * @template Value - The input value type
 * @template FilterValue - The output value type after transformation
 */
type FilterFunction<Value, FilterValue> = (
  value: Value
) => Option<FilterValue> | Promise<Option<FilterValue>>;

/**
 * Function type for transforming values in map operations.
 * Transforms each input value to an output value of potentially different type.
 *
 * @template Value - The input value type
 * @template MapValue - The output value type after transformation
 */
type MapFunction<Value, MapValue> = (
  value: Value
) => MapValue | Promise<MapValue>;

/**
 * Interface defining all extension methods available on Iterup instances.
 * These methods are dynamically added to iterator instances through a Proxy,
 * providing a fluent interface for chaining operations.
 *
 * @template Value - The type of values in the iterator
 */
export type Extensions<Value> = {
  filterMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Iterup<FilterValue>;

  filter(
    f: (value: Value) => boolean | Promise<boolean>
  ): Promise<Value | undefined>;

  findMap<FilterValue>(
    f: FilterFunction<Value, FilterValue>
  ): Promise<FilterValue | undefined>;

  enumerate(): Iterup<[Value, number]>;

  collect(): Promise<Array<Value>>;

  toArray(): Promise<Array<Value>>;

  map<MapValue>(f: MapFunction<Value, MapValue>): Iterup<MapValue>;

  flatMap<MapValue>(
    f: MapFunction<Value, Iterable<MapValue> | BaseIterator<MapValue>>
  ): Iterup<MapValue>;

  take(count: number): Iterup<Value>;

  drop(count: number): Iterup<Value>;

  cycle(cycles?: number): Iterup<Value>;

  zip<AnotherValue>(
    iterator: BaseIterator<AnotherValue>
  ): Iterup<[Value, AnotherValue]>;

  fold<NewValue>(
    initialValue: NewValue,
    f: (accumulator: NewValue, value: Value) => NewValue | Promise<NewValue>
  ): Promise<NewValue>;

  reduce(
    f: (accumulator: Value, value: Value) => Value | Promise<Value>
  ): Promise<Value | None>;

  forEach(f: (value: Value) => void | Promise<void>): Promise<void>;
};

/**
 * Object mapping extension method names to their implementations.
 * This is used by the Proxy in fromAsyncIterator to dynamically
 * provide extension methods on Iterup instances.
 */
export const Extensions: Record<keyof Extensions<{}>, any> = {
  filterMap,
  findMap,
  collect,
  toArray: collect,
  enumerate,
  drop,
  take,
  flatMap,
  map,
  filter,
  cycle,
  zip,
  fold,
  reduce,
  forEach,
};

export type NumericExtensions<Value> = {
  sum(): Promise<number>;
  min(): Promise<number>;
  max(): Promise<number>;
};

export const NumericExtensions: Record<keyof NumericExtensions<{}>, any> = {
  sum,
  min,
  max,
};
