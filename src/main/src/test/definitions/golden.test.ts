/**
 * Locks ProjectData factory / relation behavior with a golden snapshot.
 * Stored JSON (including key order) and relation traversal results must stay identical.
 *
 * Run: npx tsx --tsconfig src/main/tsconfig.json src/main/src/test/definitions/golden.test.ts
 * Update: append --update to the command above (only for intended changes)
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { RecordKey } from "@shared/constants";
import {
  ComponentDefinition,
  ConfigDefinition,
  CoordDefinition,
  ElementDefinition,
  ListenerDefinition,
  NodeDefinition,
  PluginPointerDefinition,
  PositionDefinition,
  ProjectDefinition,
  ResourceDefinition,
  ScreenConfigDefinition,
  StepDefinition,
  TransitionDefinition,
  ValueDefinition,
  ValueProcessDefinition,
  VariableDefinition,
  ViewportDefinition,
  createDragOption,
  listVariantCases,
  type VariantDescriptor
} from "@shared/projectData/definitions";
import type { Types } from "@shared/projectData/types";
import {
  createOwnedRecorder,
  createRelationFixture,
  normalizeGeneratedIds
} from "./goldenFixtures";

type AnyRecord = Record<string, any>;

const SNAPSHOT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "goldenSnapshot.json");

function capture(
  create: (registerOwned: ReturnType<typeof createOwnedRecorder>["registerOwned"]) => unknown
) {
  const { log, registerOwned } = createOwnedRecorder();
  const result = normalizeGeneratedIds(create(registerOwned));
  return log.length > 0 ? { result, owned: log } : { result };
}

/** `variants`: payload variant per type-payload name (PayloadVariants from typePayload) */
export function collectFactoryGolden(variants: Record<string, VariantDescriptor>) {
  const cases: Record<string, unknown> = {};

  cases["resource"] = capture(() => ResourceDefinition.create());
  cases["variable"] = capture(() => VariableDefinition.create());
  cases["pluginPointer"] = capture(() =>
    PluginPointerDefinition.create(undefined, undefined as never)
  );
  cases["position"] = capture(() => PositionDefinition.create());
  cases["position/override"] = capture(() =>
    PositionDefinition.create({ distance: 10, origin: "center" })
  );
  cases["coord"] = capture(() => CoordDefinition.create());
  cases["coord/partialNested"] = capture(() =>
    CoordDefinition.create({ x: { distance: 5 } } as Partial<Types.Coord>)
  );
  cases["transition"] = capture((r) => TransitionDefinition.create(undefined, r));
  cases["transition/override"] = capture(() =>
    TransitionDefinition.create({ plugin: "plugin-x", duration: 100 })
  );
  cases["component"] = capture((r) => ComponentDefinition.create(undefined, r));
  cases["component/override"] = capture((r) =>
    ComponentDefinition.create(
      {
        id: "comp",
        elements: ["el-1"],
        pos: { x: { origin: "end" } },
        frame: "frame-1",
        introTransition: { easing: "easeIn" }
      } as any,
      r
    )
  );
  cases["viewport"] = capture(() => ViewportDefinition.create());
  cases["config"] = capture(() => ConfigDefinition.create());
  cases["dragOption/disabled"] = capture(() => createDragOption());
  cases["dragOption/enabled"] = capture(() =>
    createDragOption({ use: true, hotspots: [{ x: { distance: 1 } } as any] })
  );
  cases["value"] = capture((r) => ValueDefinition.create(undefined, r));

  for (const nodeType of ["entry", "sequence", "branch", "variableSet"] as const) {
    cases[`node/${nodeType}`] = capture((r) => NodeDefinition.create({ nodeType } as never, r));
  }
  cases["node/default"] = capture((r) => NodeDefinition.create(undefined, r));
  cases["node/unknownType"] = capture((r) =>
    NodeDefinition.create({ nodeType: "unknown", steps: ["s"] } as any, r)
  );
  cases["node/nullType"] = capture((r) => NodeDefinition.create({ nodeType: null } as any, r));
  cases["node/entryWithPayload"] = capture((r) =>
    NodeDefinition.create({ nodeType: "entry", type: "shortcut", payload: { key: "K" } } as any, r)
  );
  cases["value/variable"] = capture((r) =>
    ValueDefinition.create({ baseType: "variable", baseValue: "var-1" } as any, r)
  );
  cases["value/customBaseType"] = capture((r) =>
    ValueDefinition.create({ baseType: "number", baseValue: "3" } as any, r)
  );
  cases["step/nullType"] = capture((r) => StepDefinition.create({ type: null } as any, r));
  cases["step/groupType"] = capture((r) => StepDefinition.create({ type: "Audio" } as any, r));
  cases["step/payloadOverrides"] = capture((r) =>
    StepDefinition.create(
      {
        type: "Audio.play",
        payload: { resourceId: "res", channel: null, volume: { x: 1 }, loop: true, extra: 1 }
      } as any,
      r
    )
  );
  cases["step/arrayOverride"] = capture((r) =>
    StepDefinition.create({ type: "Preload.add", payload: { resourceArr: ["a", "b"] } } as any, r)
  );
  cases["step/openPayload"] = capture((r) =>
    StepDefinition.create({ type: "Audio.reset", payload: { any: { deep: 1 } } } as any, r)
  );
  cases["listener/primitivePayload"] = capture((r) =>
    ListenerDefinition.create({ type: "input", payload: "text" } as any, r)
  );
  cases["element/dragOption"] = capture((r) =>
    ElementDefinition.create({ dragOption: { use: true, extra: 1, hotspots: [{}] } } as any, r)
  );

  const variantFactories: [string, (o: AnyRecord, r: any) => unknown][] = [
    ["element", (o, r) => ElementDefinition.create(o as any, r)],
    ["entry", (o, r) => NodeDefinition.create({ ...o, nodeType: "entry" } as any, r)],
    ["listener", (o, r) => ListenerDefinition.create(o as any, r)],
    ["screenConfig", (o, r) => ScreenConfigDefinition.create(o as any, r)],
    ["step", (o, r) => StepDefinition.create(o as any, r)],
    ["valueProcess", (o, r) => ValueProcessDefinition.create(o as any, r)]
  ];
  for (const [name, create] of variantFactories) {
    cases[`${name}/default`] = capture((r) => create({}, r));
    for (const [type] of listVariantCases(variants[name].cases)) {
      cases[`${name}/${type}`] = capture((r) => create({ type }, r));
    }
  }

  cases["project"] = capture((r) =>
    ProjectDefinition.create({ updatedAt: 0 } as Partial<Types.Data>, r)
  );
  cases["project/records"] = capture((r) =>
    ProjectDefinition.create(
      {
        updatedAt: 0,
        components: { "comp-key": { alias: "c" } },
        pluginPointers: { "pp-key": { name: "p" } },
        values: { "value-key": { baseType: "variable" } },
        nodes: { "node-key": { nodeType: "branch", valueA: "a", valueB: "b" } },
        steps: { "step-key": { type: "Audio.play" } }
      } as any,
      r
    )
  );

  return cases;
}

type RelationFns = typeof import("@shared/projectData/relation");

export function collectRelationGolden(relation: RelationFns) {
  const project = createRelationFixture();
  const records: Record<string, unknown> = {};
  const relationIds: Record<string, unknown[]> = {};
  const recordKeys = Object.entries(relation.RelationMap)
    .filter(([key, tree]) => key !== "config" && tree && Object.keys(tree).length > 0)
    .map(([key]) => key);

  const allRecordKeys: RecordKey[] = [
    "resources",
    "variables",
    "nodes",
    "steps",
    "components",
    "elements",
    "listeners",
    "valueProcesses",
    "pluginPointers",
    "values"
  ];
  for (const type of allRecordKeys) {
    records[type] = Object.fromEntries(project[type]);
  }

  relationIds["config"] = [];
  relation.forEachRelationId("config", project.config, (d) => relationIds["config"].push(d), {
    includePath: true
  });
  for (const type of recordKeys as RecordKey[]) {
    for (const [id, data] of project[type]) {
      const key = `${type}:${id}`;
      relationIds[key] = [];
      relation.forEachRelationId(type, data as never, (d) => relationIds[key].push(d), {
        includePath: true
      });
      relationIds[`${key}#onlyOwns`] = [];
      relation.forEachRelationId(
        type,
        data as never,
        (d) => relationIds[`${key}#onlyOwns`].push(d),
        { onlyOwns: true }
      );
    }
  }

  const walks: Record<string, unknown[]> = {};
  const walk = (name: string, type: RecordKey, id: string, opt: AnyRecord = {}) => {
    walks[name] = [];
    relation.deepForEach(
      project,
      type,
      id,
      ({ type, id, owned, level, via }) => walks[name].push({ type, id, owned, level, via }),
      opt
    );
  };
  for (const id of project.nodes.keys()) {
    walk(`nodes:${id}`, "nodes", id, { includePath: true });
    walk(`nodes:${id}#onlyOwns`, "nodes", id, { onlyOwns: true });
  }
  walk("components:comp-1", "components", "comp-1", { includePath: true });
  walk("nodes:node-entry#maxLevel2", "nodes", "node-entry", { maxLevel: 2 });
  walk("nodes:node-seq#includes", "nodes", "node-seq", {
    includes: ["steps", "components", "resources"]
  });

  return { records, config: project.config, relationIds, walks };
}

export async function runGoldenTest(update = false) {
  (globalThis as any).__APP_VERSION__ = "golden-test";
  const { PayloadVariants } = await import("@shared/projectData/typePayload");
  const relation = await import("@shared/projectData/relation");

  const actual = JSON.parse(
    JSON.stringify({
      factories: collectFactoryGolden(PayloadVariants),
      relations: collectRelationGolden(relation)
    })
  );
  const serialized = JSON.stringify(actual, null, 2) + "\n";

  if (update || !existsSync(SNAPSHOT_PATH)) {
    writeFileSync(SNAPSHOT_PATH, serialized);
    console.log(`[UPDATED] ${SNAPSHOT_PATH}`);
    return;
  }

  const expected = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  assert.deepEqual(actual, expected);
  assert.equal(serialized, JSON.stringify(expected, null, 2) + "\n", "key order changed");
  console.log("[PASS] golden snapshot");
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath && resolve(fileURLToPath(import.meta.url)) === invokedPath) {
  await runGoldenTest(process.argv.includes("--update"));
}
