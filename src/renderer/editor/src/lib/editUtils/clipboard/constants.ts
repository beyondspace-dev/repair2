import {
  PROJECT_RECORDS,
  type RecordKey,
  type RecordValue,
  type SINGULAR_RECORD_MAP
} from "@shared/constants";
import { listVariantCases, NodeDefinition } from "@shared/projectData/definitions";
import { findOwners } from "@shared/projectData/relation";
import type { Types } from "@shared/projectData/types";
import type { ExtractResult } from "../extractData";
import { typedIncludes } from "@shared/utils.types";

export const ClipboardFormat = "application/x-repair2-clipboard-binary";

export type CopyMapType = { copy?: boolean; remove?: boolean; paste?: boolean };

export const CopyMap = {
  project: { copy: false, remove: false },
  entry: { paste: false },
  branch: { paste: false },
  variableSet: { paste: false },
  value: { remove: false, copy: false },
  valueProcess: { paste: false },
  sequence: {},
  step: { paste: false },
  component: { copy: false, remove: false },
  element: {},
  listener: { paste: false }
} as const satisfies Record<string, CopyMapType>;

type NodeType = Types.Node["nodeType"];

const CONTEXT_NODE_TYPES = listVariantCases(NodeDefinition.shape.nodeType.cases).map(
  ([nodeType]) => nodeType as NodeType
);

export const CONTEXT_FOCUS_TYPE_MAP = Object.fromEntries(
  Object.keys(CopyMap).map((t) => [t, typedIncludes(CONTEXT_NODE_TYPES, t) ? "node" : t])
) as {
  [k in keyof typeof CopyMap]: k extends NodeType ? "node" : k;
};

export type Copiable =
  | Exclude<
      {
        [K in keyof typeof CopyMap]: (typeof CopyMap)[K] extends { copy: false } ? never : K;
      }[keyof typeof CopyMap],
      NodeType
    >
  | "node"
  | "nodes";

export type Removable =
  | Exclude<
      {
        [K in keyof typeof CopyMap]: (typeof CopyMap)[K] extends { remove: false } ? never : K;
      }[keyof typeof CopyMap],
      NodeType
    >
  | "node"
  | "nodes";

type CopiedSingleData<T extends Exclude<Copiable, "nodes">> = RecordValue<
  (typeof SINGULAR_RECORD_MAP)[T]
>;

export type CopiedDataMap = {
  [K in Exclude<Copiable, "nodes">]: {
    REPAIR_VERSION: string;
    type: K;
    data: CopiedSingleData<K>;
    owned: ExtractResult;
  };
} & {
  nodes: {
    REPAIR_VERSION: string;
    type: "nodes";
    data: Types.Node[];
    owned: ExtractResult;
  };
};

export type CopiedData = CopiedDataMap[keyof CopiedDataMap];

type Pastable = {
  [K in keyof typeof CopyMap]: (typeof CopyMap)[K] extends { paste: false } ? never : K;
}[keyof typeof CopyMap];

/** Focus type that a pasted record is appended to, the id array field that owns it, and the owner record type */
function pasteOwner(type: RecordKey): readonly [Pastable, string, RecordKey] {
  const owners = findOwners(type).filter((owner) => owner.cardinality === "many");
  if (owners.length !== 1 || owners[0].path.length !== 1) {
    throw new Error(`Expected a single owning id array for ${type}.`);
  }
  const [owner] = owners;
  return [(owner.case ?? PROJECT_RECORDS[owner.type]) as Pastable, owner.path[0], owner.type];
}

export const ClipboardOwnMap: Record<Copiable, true | readonly [Pastable, string, RecordKey]> = {
  nodes: true,
  node: true,
  valueProcess: pasteOwner("valueProcesses"),
  step: pasteOwner("steps"),
  element: pasteOwner("elements"),
  listener: pasteOwner("listeners")
};
