import type { RecordKey } from "../../constants";
import { isRelationLeaf, isRelationTree, KIND, RelationMap, TYPE } from "./map";
import type { RelationTree } from "./types";

/** A field that owns records of a given type */
export type RelationOwner = {
  readonly type: RecordKey;
  /** Variant case that declares the field, or null when it is declared for every case */
  readonly case: string | null;
  readonly path: readonly string[];
  readonly cardinality: "one" | "many";
};

/** Lists every OWN relation field that targets records of `target`. */
export function findOwners(target: RecordKey): RelationOwner[] {
  const owners: RelationOwner[] = [];

  function visit(type: RecordKey, tree: RelationTree, path: string[], caseName: string | null) {
    for (const [name, caseTree] of Object.entries(tree.$cases ?? {})) {
      visit(type, caseTree, path, name);
    }
    for (const key in tree) {
      if (key === "$dependsOn" || key === "$cases") continue;
      const relation = tree[key];
      if (isRelationLeaf(relation)) {
        if (relation.$key === target && relation.$kind === KIND.OWN) {
          owners.push({
            type,
            case: caseName,
            path: [...path, key],
            cardinality: relation.$type === TYPE.ID ? "one" : "many"
          });
        }
      } else if (isRelationTree(relation)) {
        visit(type, relation, [...path, key], caseName);
      }
    }
  }

  for (const [type, tree] of Object.entries(RelationMap)) {
    if (type !== "config" && tree) visit(type as RecordKey, tree, [], null);
  }
  return owners;
}
