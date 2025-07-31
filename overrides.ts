import type { Iterup } from "./core";

export type Overrides<Value> = {
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
export type OverrideFunctions<Value> = keyof Overrides<Value>;
export const OverrideFunctions = new Set<OverrideFunctions<{}>>([
  "map",
  "filter",
  "flatMap",
]);
