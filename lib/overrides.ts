/**
 * Override system for customizing default iterator behavior.
 *
 * This module provides a framework for overriding specific methods
 * on iterator instances. Currently empty but extensible for future needs.
 */

/**
 * Interface for override methods that can replace default iterator behavior.
 * Currently empty but can be extended to add custom method overrides.
 *
 * @template Value - The type of values in the iterator
 */
export type Overrides<Value> = {};

/**
 * Union type of all function names that can be overridden.
 * Derived from the keys of the Overrides interface.
 *
 * @template Value - The type of values in the iterator
 */
export type OverrideFunctions<Value> = keyof Overrides<Value>;

/**
 * Set containing the names of all functions that have overrides.
 * Used internally to determine whether to wrap function results with iterup().
 */
export const OverrideFunctions: Set<OverrideFunctions<{}>> = new Set();
