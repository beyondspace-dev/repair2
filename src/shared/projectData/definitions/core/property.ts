import {
  isNestedDescriptor,
  isValueDescriptor,
  isVariantDescriptor,
  type Shape,
  type ValueDescriptor
} from "./descriptor";
import { listVariantCases } from "./variant";

/** Variant condition for a Property to exist. Valid only when the value at `path` is `value`. */
export type PropertyCondition = {
  readonly path: readonly string[];
  readonly value: string;
};

export type PropertyEntry = {
  readonly path: readonly string[];
  readonly descriptor: ValueDescriptor<unknown, true>;
  readonly conditions: readonly PropertyCondition[];
};

/** Collects only the values declared with `prop.*`, following nested definitions and variant cases. */
export function collectProperties(
  shape: Shape,
  prefix: readonly string[] = [],
  conditions: readonly PropertyCondition[] = []
): PropertyEntry[] {
  const result: PropertyEntry[] = [];
  for (const key in shape) {
    const descriptor = shape[key];
    const path = [...prefix, key];
    if (isValueDescriptor(descriptor)) {
      if (descriptor.property) {
        result.push({
          path,
          descriptor: descriptor as ValueDescriptor<unknown, true>,
          conditions
        });
      }
    } else if (isNestedDescriptor(descriptor)) {
      result.push(...collectProperties(descriptor.definition.shape, path, conditions));
    } else if (isVariantDescriptor(descriptor)) {
      const casePrefix =
        descriptor.payloadKey === null ? prefix : [...prefix, descriptor.payloadKey];
      for (const [name, caseShape] of listVariantCases(descriptor.cases)) {
        if (!caseShape) continue;
        result.push(
          ...collectProperties(caseShape, casePrefix, [...conditions, { path, value: name }])
        );
      }
    }
  }
  return result;
}
