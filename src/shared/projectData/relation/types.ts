import type { RecordKey, RecordValue } from "../../constants";
import type { Types } from "../types";

export enum TYPE {
  ID = 0,
  ID_ARRAY = 1
}

export enum KIND {
  OWN = 0,
  REF = 1
}

export type RelationRootKey = RecordKey | "config";
export type RelationRootData<K extends RelationRootKey> = K extends "config"
  ? Types.ProjectConfig
  : K extends RecordKey
    ? RecordValue<K>
    : never;

export type RelationLeaf = {
  $type: TYPE;
  $key: RecordKey;
  $kind: KIND;
};

export type RelationTree<T = unknown> = {
  [key: string]: RelationTree | RelationLeaf | RelationCaseMap | string | undefined;
  $dependsOn?: T extends object ? keyof T & string : string;
  $cases?: RelationCaseMap;
};

export type RelationCaseMap = Record<string, RelationTree>;

export type RelationMapType = {
  [K in RelationRootKey]?: RelationTree<RelationRootData<K>>;
};

export function isRelationLeaf(value: unknown): value is RelationLeaf {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "$type" in value &&
    "$key" in value
  );
}

export function isRelationTree(value: unknown): value is RelationTree {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && !isRelationLeaf(value)
  );
}
