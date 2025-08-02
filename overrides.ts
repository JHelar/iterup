/**
 * Type definition for overridden iterator methods that return Iterup instances.
 * These methods replace the standard iterator methods to maintain chainability
 * and provide lazy evaluation throughout the operation chain.
 *
 * @template Value - The type of values in the iterator
 */
export type Overrides<Value> = {};

/**
 * Type representing the names of overridden functions.
 * Used internally to identify which methods should return Iterup instances.
 *
 * @template Value - The type of values in the iterator
 */
export type OverrideFunctions<Value> = keyof Overrides<Value>;

/**
 * Set of function names that are overridden to return Iterup instances.
 * Used internally by the proxy to determine when to wrap return values.
 */
export const OverrideFunctions: Set<OverrideFunctions<{}>> = new Set();
