import type { BaseIterator, Iterup, Option } from "../core";
import {
  collect,
  drop,
  enumerate,
  filter,
  filterMap,
  findMap,
  flatMap,
  map,
  take,
} from "./methods";

type FilterFunction<Value, FilterValue> = (
  value: Value
) => Option<FilterValue> | Promise<Option<FilterValue>>;

type MapFunction<Value, MapValue> = (
  value: Value
) => MapValue | Promise<MapValue>;

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
};

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
};
