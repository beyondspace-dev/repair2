import {
  DESCRIPTOR,
  type AnyDataDefinition,
  type NestedDescriptor,
  type RecordDefinitionLike,
  type RecordsDescriptor
} from "./descriptor";

/** Uses another definition as an inner object. */
export function nested<D extends AnyDataDefinition>(definition: D): NestedDescriptor<D> {
  return {
    [DESCRIPTOR]: "nested",
    definition
  };
}

/** Record map of the project root. e.g. `components: records(ComponentDefinition)` */
export function records<D extends RecordDefinitionLike>(definition: D): RecordsDescriptor<D> {
  return {
    [DESCRIPTOR]: "records",
    definition
  };
}
