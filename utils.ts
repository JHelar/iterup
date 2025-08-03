import {
  BaseAsyncIterator,
  BaseSyncIterator,
  IterupID,
  type Iterup,
} from "./core";

export function isIterator<Value>(
  value: unknown
): value is BaseSyncIterator<Value> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.iterator in value && typeof value[Symbol.iterator] === "function"
  );
}

export function isAsyncIterator<Value>(
  value: unknown
): value is BaseAsyncIterator<Value> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return (
    Symbol.asyncIterator in value &&
    typeof value[Symbol.asyncIterator] === "function"
  );
}

export function isIterup<Value>(
  value: BaseAsyncIterator<Value>
): value is Iterup<Value> {
  return IterupID in value;
}
