export type Overrides<Value> = {};

export type OverrideFunctions<Value> = keyof Overrides<Value>;

export const OverrideFunctions: Set<OverrideFunctions<{}>> = new Set();
