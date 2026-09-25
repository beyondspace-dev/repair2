import { DESCRIPTOR, type AnyDataDefinition, type NestedDescriptor } from "./descriptor";

/** Uses another definition as an inner object. */
export function nested<D extends AnyDataDefinition>(definition: D): NestedDescriptor<D> {
  return {
    [DESCRIPTOR]: "nested",
    definition
  };
}
