import type { RecordKey } from "../../constants";

/** Root container of a data path: a project record or the project config */
export type DataTarget = { kind: "record"; type: RecordKey; id: string } | { kind: "config" };

/** Keys from the target root to a value */
export type DataPath = readonly (string | number)[];

/** Address of any value in the project data, including structural data such as ids and id arrays */
export type DataRef = {
  readonly target: DataTarget;
  readonly path: DataPath;
};

/** Stable string key of a target, e.g. `components:<id>` or `config` */
export function dataTargetKey(target: DataTarget): string {
  return target.kind === "config" ? "config" : `${target.type}:${target.id}`;
}

/** Reads the value at `path` starting from `root` */
export function readDataPath(root: unknown, path: DataPath): unknown {
  let value = root;
  for (const key of path) value = (value as Record<string | number, unknown>)[key];
  return value;
}
