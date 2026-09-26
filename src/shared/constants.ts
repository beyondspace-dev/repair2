import type { Types } from "./projectData/types";
import { typedEntries, typedFromEntries, type ReverseRecord, type ValueOf } from "./utils.types";

export const PLUGIN_TYPES = ["runtime", "element", "transition", "function", "frame"] as const;

/**
 * Record maps of the project root and the singular name of each record type.
 * ProjectDefinitions must declare a definition for every key.
 */
export const PROJECT_RECORDS = {
  resources: "resource",
  variables: "variable",
  nodes: "node",
  steps: "step",
  components: "component",
  elements: "element",
  listeners: "listener",
  valueProcesses: "valueProcess",
  pluginPointers: "pluginPointer",
  values: "value"
} as const;

export const SINGULAR_RECORD_MAP = typedFromEntries(
  typedEntries(PROJECT_RECORDS).map(([a, b]) => [b, a])
) as ReverseRecord<typeof PROJECT_RECORDS>;

export type RecordKey = keyof typeof PROJECT_RECORDS;
export type RecordValue<K extends RecordKey = RecordKey> = ValueOf<Types.Data[K]>;
