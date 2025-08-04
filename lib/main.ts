/**
 * Main entry point for the iterup library.
 *
 * This module exports the core functionality for working with iterators in a functional style.
 * It provides the main `iterup` function to wrap iterators and various utility methods
 * for transforming and processing iterator data.
 *
 * @example
 * ```ts
 * import { iterup, None } from '@jhel/iterup';
 *
 * const result = await iterup([1, 2, 3, 4, 5])
 *   .map(x => x * 2)
 *   .filter(x => x > 5)
 *   .collect();
 * // result: [6, 8, 10]
 * ```
 */

export { iterup, None } from "./core";
export {
  enumerate,
  filterMap,
  findMap,
  collect,
  map,
  flatMap,
  take,
  drop,
  range,
  sum,
  cycle,
} from "./methods";
