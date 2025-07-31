import { IterupID, type Iterup } from "./core";

export function isIterator<Value>(
  value: unknown
): value is IteratorObject<Value, undefined, unknown> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.iterator in value && typeof value[Symbol.iterator] === "function"
  );
}

export function isIterup<Value>(
  value: IteratorObject<Value, undefined, unknown>
): value is Iterup<Value> {
  return IterupID in value;
}
