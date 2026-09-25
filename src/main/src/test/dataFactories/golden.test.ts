/**
 * Locks ProjectData factory / relation behavior with a golden snapshot.
 * Stored JSON (including key order) and relation traversal results must stay identical.
 *
 * Run: npx tsx --tsconfig src/main/tsconfig.json src/main/src/test/dataFactories/golden.test.ts
 * Update: append --update to the command above (only for intended changes)
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { RecordKey } from "@shared/constants";
import { createViewportData } from "@shared/projectData/factories/viewport";
import type { Types } from "@shared/projectData/types";
import {
  createOwnedRecorder,
  createRelationFixture,
  listTemplateTypes,
  normalizeGeneratedIds
} from "./goldenFixtures";

type AnyRecord = Record<string, any>;
type Factories = typeof import("@shared/projectData/factories");

const SNAPSHOT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "goldenSnapshot.json");

function capture(
  create: (registerOwned: ReturnType<typeof createOwnedRecorder>["registerOwned"]) => unknown
) {
  const { log, registerOwned } = createOwnedRecorder();
  const result = normalizeGeneratedIds(create(registerOwned));
  return log.length > 0 ? { result, owned: log } : { result };
}

export function collectFactoryGolden(f: Factories, templates: AnyRecord) {
  const cases: Record<string, unknown> = {};

  cases["resource"] = capture(() => f.createResource());
  cases["variable"] = capture(() => f.createVariable());
  cases["pluginPointer"] = capture(() => f.createPluginPointer(undefined, undefined as never));
  cases["position"] = capture(() => f.createPosition());
  cases["position/override"] = capture(() => f.createPosition({ distance: 10, origin: "center" }));
  cases["coord"] = capture(() => f.createCoord());
  cases["coord/partialNested"] = capture(() =>
    f.createCoord({ x: { distance: 5 } } as Partial<Types.Coord>)
  );
  cases["transition"] = capture((r) => f.createTransition(undefined, r));
  cases["transition/override"] = capture(() =>
    f.createTransition({ plugin: "plugin-x", duration: 100 })
  );
  cases["component"] = capture((r) => f.createComponent(undefined, r));
  cases["component/override"] = capture((r) =>
    f.createComponent(
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
  cases["viewport"] = capture(() => createViewportData());
  cases["config"] = capture(() => f.createConfig());
  cases["dragOption/disabled"] = capture(() => f.createDragOption());
  cases["dragOption/enabled"] = capture(() =>
    f.createDragOption({ use: true, hotspots: [{ x: { distance: 1 } } as any] })
  );
  cases["value"] = capture((r) => f.createValue(undefined, r));

  for (const nodeType of ["entry", "sequence", "branch", "variableSet"] as const) {
    cases[`node/${nodeType}`] = capture((r) =>
      f.createNode({ nodeType } as Partial<Types.Node>, r)
    );
  }
  cases["node/default"] = capture((r) => f.createNode(undefined, r));
  cases["node/unknownType"] = capture((r) =>
    f.createNode({ nodeType: "unknown", steps: ["s"] } as any, r)
  );
  cases["node/nullType"] = capture((r) => f.createNode({ nodeType: null } as any, r));
  cases["node/entryWithPayload"] = capture((r) =>
    f.createNode({ nodeType: "entry", type: "shortcut", payload: { key: "K" } } as any, r)
  );
  cases["value/variable"] = capture((r) =>
    f.createValue({ baseType: "variable", baseValue: "var-1" } as any, r)
  );
  cases["value/customBaseType"] = capture((r) =>
    f.createValue({ baseType: "number", baseValue: "3" } as any, r)
  );
  cases["step/nullType"] = capture((r) => f.createStep({ type: null } as any, r));
  cases["step/groupType"] = capture((r) => f.createStep({ type: "Audio" } as any, r));
  cases["step/payloadOverrides"] = capture((r) =>
    f.createStep(
      {
        type: "Audio.play",
        payload: { resourceId: "res", channel: null, volume: { x: 1 }, loop: true, extra: 1 }
      } as any,
      r
    )
  );
  cases["step/arrayOverride"] = capture((r) =>
    f.createStep({ type: "Preload.add", payload: { resourceArr: ["a", "b"] } } as any, r)
  );
  cases["step/openPayload"] = capture((r) =>
    f.createStep({ type: "Audio.reset", payload: { any: { deep: 1 } } } as any, r)
  );
  cases["listener/primitivePayload"] = capture((r) =>
    f.createListener({ type: "input", payload: "text" } as any, r)
  );
  cases["element/dragOption"] = capture((r) =>
    f.createElement({ dragOption: { use: true, extra: 1, hotspots: [{}] } } as any, r)
  );

  const variantFactories: [string, (o: AnyRecord, r: any) => unknown][] = [
    ["element", (o, r) => f.createElement(o as any, r)],
    ["entry", (o, r) => f.createEntry(o as any, r)],
    ["listener", (o, r) => f.createListener(o as any, r)],
    ["screenConfig", (o, r) => f.createScreenConfig(o as any, r)],
    ["step", (o, r) => f.createStep(o as any, r)],
    ["valueProcess", (o, r) => f.createValueProcess(o as any, r)]
  ];
  for (const [name, create] of variantFactories) {
    cases[`${name}/default`] = capture((r) => create({}, r));
    for (const type of listTemplateTypes(templates[name])) {
      cases[`${name}/${type}`] = capture((r) => create({ type }, r));
    }
  }

  cases["project"] = capture((r) => f.createProject({ updatedAt: 0 } as Partial<Types.Data>, r));
  cases["project/records"] = capture((r) =>
    f.createProject(
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

export function collectRelationGolden(f: Factories, relation: RelationFns) {
  const project = createRelationFixture(f);
  const records: Record<string, unknown> = {};
  const relationIds: Record<string, unknown[]> = {};
  const recordKeys = Object.keys(relation.RelationMap).filter((k) => k !== "config");

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
  const f = await import("@shared/projectData/factories");
  const { PayloadTemplates } = await import("@shared/projectData/typePayload/templates");
  const relation = await import("@shared/projectData/relation");

  const actual = JSON.parse(
    JSON.stringify({
      factories: collectFactoryGolden(f, PayloadTemplates as AnyRecord),
      relations: collectRelationGolden(f, relation)
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
