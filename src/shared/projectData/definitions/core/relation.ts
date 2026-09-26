import type { RecordKey } from "../../../constants";
import {
  KIND,
  TYPE,
  type RelationCaseMap,
  type RelationLeaf,
  type RelationTree
} from "../../relation/types";
import {
  DESCRIPTOR,
  isNestedDescriptor,
  isRelationDescriptor,
  isVariantDescriptor,
  type RelationDescriptor,
  type Shape,
  type VariantDescriptor
} from "./descriptor";
import { listVariantCases } from "./variant";

function one<K extends RecordKey>(
  target: K,
  opt: { kind: "own"; create: true }
): RelationDescriptor<K, "one", "own", string, true>;
function one<K extends RecordKey, Kind extends "own" | "ref">(
  target: K,
  opt: { kind: Kind; default?: null }
): RelationDescriptor<K, "one", Kind, string | null, false>;
function one(
  target: RecordKey,
  opt: { kind: "own" | "ref"; create?: true; default?: null }
): RelationDescriptor {
  return {
    [DESCRIPTOR]: "relation",
    target,
    cardinality: "one",
    kind: opt.kind,
    creates: opt.create === true,
    default: null
  };
}

/** ID array. The default is always a new empty array. */
function many<K extends RecordKey, Kind extends "own" | "ref">(
  target: K,
  opt: { kind: Kind }
): RelationDescriptor<K, "many", Kind, string[], false> {
  return {
    [DESCRIPTOR]: "relation",
    target,
    cardinality: "many",
    kind: opt.kind,
    creates: false,
    default: () => []
  };
}

export const relation = { one, many };

export function toRelationLeaf(descriptor: RelationDescriptor): RelationLeaf {
  return {
    $type: descriptor.cardinality === "one" ? TYPE.ID : TYPE.ID_ARRAY,
    $key: descriptor.target,
    $kind: descriptor.kind === "own" ? KIND.OWN : KIND.REF
  };
}

/**
 * Builds a tree in the RelationMap format from a definition shape.
 * Nested definitions and variant cases without relations are omitted.
 */
export function buildRelationTree(shape: Shape): RelationTree {
  const tree: RelationTree = {};
  for (const key in shape) {
    const descriptor = shape[key];
    if (isRelationDescriptor(descriptor)) {
      tree[key] = toRelationLeaf(descriptor);
    } else if (isNestedDescriptor(descriptor)) {
      const child = buildRelationTree(descriptor.definition.shape);
      if (Object.keys(child).length > 0) tree[key] = child;
    } else if (isVariantDescriptor(descriptor)) {
      const variant = descriptor as VariantDescriptor;
      const cases: RelationCaseMap = {};
      for (const [name, caseShape] of listVariantCases(variant.cases)) {
        if (!caseShape) continue;
        const child = buildRelationTree(caseShape);
        if (Object.keys(child).length === 0) continue;
        cases[name] = variant.payloadKey === null ? child : { [variant.payloadKey]: child };
      }
      if (Object.keys(cases).length > 0) {
        tree.$dependsOn = key;
        tree.$cases = cases;
      }
    }
  }
  return tree;
}
