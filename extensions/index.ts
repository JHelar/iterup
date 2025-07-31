import type { Iterup, Option } from "../core";
import { collect, enumerate, filterMap, findMap } from "./methods";

type FilterFunction<Value, FilterValue> = (
  value: Value,
  index: number
) => Option<FilterValue>;

export type Extensions<Value> = {
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

export const Extensions = {
  filterMap,
  findMap,
  collect,
  toArray: collect,
  enumerate,
} satisfies Record<keyof Extensions<{}>, any>;
