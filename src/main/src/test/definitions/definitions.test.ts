/**
 * Checks that create() of the new definitions matches the legacy factories at the JSON level (including key order).
 *
 * Run: npx tsx --tsconfig src/main/tsconfig.json src/main/src/test/definitions/definitions.test.ts
 */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { collectFactoryGolden } from "../dataFactories/golden.test";
import { createOwnedRecorder, normalizeGeneratedIds } from "../dataFactories/goldenFixtures";

type AnyRecord = Record<string, any>;

const GOLDEN_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../dataFactories/goldenSnapshot.json"
);
type CreateLike = (overrides?: any, registerOwned?: any) => unknown;

function runCase(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

function capture(create: CreateLike, overrides?: unknown) {
  const { log, registerOwned } = createOwnedRecorder();
  const result = normalizeGeneratedIds(create(overrides, registerOwned));
  return JSON.stringify({ result, owned: log });
}

function assertSameOutput(name: string, legacy: CreateLike, next: CreateLike, cases: unknown[]) {
  runCase(`${name} create() matches legacy factory`, () => {
    for (const overrides of [undefined, {}, ...cases]) {
      assert.equal(capture(next, overrides), capture(legacy, overrides), JSON.stringify(overrides));
    }
  });
}

export async function runDefinitionTest() {
  (globalThis as any).__APP_VERSION__ = "definition-test";
  const f = await import("@shared/projectData/factories");
  const { createViewportData } = await import("@shared/projectData/factories/viewport");
  const d = await import("@shared/projectData/definitions");
  const { RelationMap } = await import("@shared/projectData/relation");
  const { PayloadTemplates } = await import("@shared/projectData/typePayload/templates");

  assertSameOutput("Position", f.createPosition, d.PositionDefinition.create as CreateLike, [
    { distance: 10, origin: "center" },
    { relative: true, extra: 1 },
    { distance: null }
  ]);
  assertSameOutput("Coord", f.createCoord, d.CoordDefinition.create as CreateLike, [
    { x: { distance: 5 } },
    { x: "wrong-shape", y: { origin: "end" } },
    { x: null }
  ]);
  assertSameOutput("Variable", f.createVariable, d.VariableDefinition.create as CreateLike, [
    { id: "var-1", name: "v" },
    { defaultValue: "x" }
  ]);
  assertSameOutput("Resource", f.createResource, d.ResourceDefinition.create as CreateLike, [
    { id: "res-1", src: "a.png" }
  ]);
  assertSameOutput(
    "PluginPointer",
    f.createPluginPointer as CreateLike,
    d.PluginPointerDefinition.create as CreateLike,
    [{ name: "p", payloads: { a: "b" } }, { exportName: null }]
  );
  assertSameOutput(
    "Transition",
    f.createTransition as CreateLike,
    d.TransitionDefinition.create as CreateLike,
    [{ plugin: "plugin-x", duration: 100 }, { plugin: null }, { easing: "easeIn" }]
  );
  assertSameOutput("Viewport", createViewportData, d.ViewportDefinition.create as CreateLike, [
    { size: 3, pos: { x: 1, y: 2 } }
  ]);
  assertSameOutput(
    "Component",
    f.createComponent as CreateLike,
    d.ComponentDefinition.create as CreateLike,
    [
      {
        id: "comp",
        elements: ["el-1"],
        pos: { x: { origin: "end" } },
        frame: "frame-1",
        introTransition: { easing: "easeIn", plugin: "intro" }
      },
      { frame: 123, outroTransition: "wrong-shape" }
    ]
  );

  runCase("definitions reproduce every legacy golden factory case", () => {
    const create = (definition: { create: unknown }) => definition.create as CreateLike;
    const adapter = {
      createResource: create(d.ResourceDefinition),
      createVariable: create(d.VariableDefinition),
      createPluginPointer: create(d.PluginPointerDefinition),
      createPosition: create(d.PositionDefinition),
      createCoord: create(d.CoordDefinition),
      createTransition: create(d.TransitionDefinition),
      createComponent: create(d.ComponentDefinition),
      createConfig: create(d.ConfigDefinition),
      createScreenConfig: create(d.ScreenConfigDefinition),
      createDragOption: d.createDragOption,
      createValue: create(d.ValueDefinition),
      createNode: create(d.NodeDefinition),
      createEntry: (o: AnyRecord = {}, r?: unknown) =>
        create(d.NodeDefinition)({ ...o, nodeType: "entry" }, r),
      createElement: create(d.ElementDefinition),
      createListener: create(d.ListenerDefinition),
      createStep: create(d.StepDefinition),
      createValueProcess: create(d.ValueProcessDefinition),
      createProject: () => null
    };
    const actual = JSON.parse(
      JSON.stringify(collectFactoryGolden(adapter as never, PayloadTemplates as AnyRecord))
    );
    const expected = JSON.parse(readFileSync(GOLDEN_PATH, "utf8")).factories;
    let compared = 0;
    for (const key of Object.keys(expected)) {
      if (key.startsWith("project")) continue;
      assert.equal(JSON.stringify(actual[key]), JSON.stringify(expected[key]), key);
      compared++;
    }
    console.log(`  compared ${compared} golden cases`);
  });

  runCase("generated relation trees match manual RelationMap", () => {
    for (const [key, definition] of Object.entries(d.ProjectDefinitions)) {
      assert.deepEqual(definition.relations, (RelationMap as AnyRecord)[key] ?? {}, key);
    }
    assert.deepEqual(d.ConfigDefinition.relations, RelationMap.config);
  });

  runCase("create(판별 값, overrides, registerOwned) equals the object form", () => {
    const pairs: [string, string, unknown, AnyRecord][] = [
      [
        "step",
        "StepDefinition",
        ["Audio.play", { payload: { volume: 1 } }],
        { type: "Audio.play", payload: { volume: 1 } }
      ],
      ["step", "StepDefinition", ["Component.create"], { type: "Component.create" }],
      ["node", "NodeDefinition", ["branch"], { nodeType: "branch" }],
      [
        "node",
        "NodeDefinition",
        ["entry", { type: "shortcut", payload: { key: "K" } }],
        { nodeType: "entry", type: "shortcut", payload: { key: "K" } }
      ],
      [
        "value",
        "ValueDefinition",
        ["number", { baseValue: "3" }],
        { baseType: "number", baseValue: "3" }
      ],
      ["step", "StepDefinition", ["delay", { type: "Audio.play" }], { type: "delay" }]
    ];
    for (const [name, definitionName, [value, overrides], objectForm] of pairs as [
      string,
      string,
      [string, unknown?],
      AnyRecord
    ][]) {
      const definition = (d as AnyRecord)[definitionName];
      const twoArg = capture((_, r) => definition.create(value, overrides, r));
      const objectArg = capture((o, r) => definition.create(o, r), objectForm);
      assert.equal(twoArg, objectArg, `${name}: ${value}`);
    }
  });

  runCase("shape validation", () => {
    assert.throws(
      () =>
        d.defineData({
          a: d.variant({ x: {} }, { default: "x" }),
          b: d.variant({ y: {} }, { default: "y" })
        }),
      /only one variant/
    );
    assert.throws(
      () => d.variant({ x: null } as never, { default: "x" } as never),
      /must be a shape/
    );
    assert.throws(
      () => d.variant({ x: {} }, { default: "x", fallback: "y" as never }),
      /fallback "y" is not a case/
    );
  });

  runCase("default values are not shared between instances", () => {
    const { registerOwned } = createOwnedRecorder();
    const a = d.ComponentDefinition.create(undefined, registerOwned) as AnyRecord;
    const b = d.ComponentDefinition.create(undefined, registerOwned) as AnyRecord;
    assert.notEqual(a.elements, b.elements);
    assert.notEqual(a.pos, b.pos);
    assert.notEqual(a.pos.x, b.pos.x);
    assert.notEqual(a.id, b.id);
  });

  runCase("owned relation without registerOwned throws like legacy factory", () => {
    assert.throws(
      () => (d.TransitionDefinition.create as CreateLike)(),
      /registerOwned is required to create an owned pluginPointers record/
    );
  });

  runCase("record metadata", () => {
    assert.equal(d.ComponentDefinition.recordKey, "components");
    assert.equal(d.ComponentDefinition.idKey, "id");
    assert.equal(d.PluginPointerDefinition.idKey, null);
    assert.equal(d.NodeDefinition.idKey, "id");
    assert.equal(d.ValueDefinition.idKey, null);
    assert.deepEqual(Object.keys(d.ProjectDefinitions), [
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
    ]);
  });

  runCase("property metadata carries variant conditions", () => {
    const definition = d.defineData({
      id: d.field.id(),
      type: d.variant(
        { a: { volume: d.prop.number(1) }, G: d.group({ b: { text: d.prop.string(null) } }) },
        { payload: "payload", default: "a" }
      )
    });
    assert.deepEqual(
      definition.properties.map(({ path, conditions }) => ({ path, conditions })),
      [
        { path: ["payload", "volume"], conditions: [{ path: ["type"], value: "a" }] },
        { path: ["payload", "text"], conditions: [{ path: ["type"], value: "G.b" }] }
      ]
    );
  });

  runCase("component property metadata follows nested definitions", () => {
    const props = d.ComponentDefinition.properties.map(({ path, descriptor }) => ({
      path: path.join("."),
      type: descriptor.spec.type,
      nullable: descriptor.nullable
    }));
    assert.deepEqual(props, [
      { path: "pos.x.distance", type: "number", nullable: true },
      { path: "pos.x.origin", type: "enum", nullable: false },
      { path: "pos.x.relative", type: "boolean", nullable: false },
      { path: "pos.y.distance", type: "number", nullable: true },
      { path: "pos.y.origin", type: "enum", nullable: false },
      { path: "pos.y.relative", type: "boolean", nullable: false },
      { path: "zIndex", type: "number", nullable: true },
      { path: "visible", type: "boolean", nullable: false },
      { path: "style", type: "string", nullable: true }
    ]);
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath && resolve(fileURLToPath(import.meta.url)) === invokedPath) {
  await runDefinitionTest();
}
