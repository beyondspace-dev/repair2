/**
 * Runtime checks for ProjectData definitions: create forms, payload variants, validation and metadata.
 *
 * Run: npx tsx --tsconfig src/main/tsconfig.json src/main/src/test/definitions/definitions.test.ts
 */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createOwnedRecorder, normalizeGeneratedIds } from "./goldenFixtures";

type AnyRecord = Record<string, any>;

type CreateLike = (overrides?: any, registerOwned?: any) => unknown;

/** Lists every leaf type string of a payload template in declaration order. */
function listTemplateTypes(template: unknown, prefix = ""): string[] {
  if (typeof template !== "object" || template === null) return [];
  const result: string[] = [];
  for (const [key, item] of Object.entries(template)) {
    if (key === "$types") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof item === "object" && item !== null && (item as AnyRecord).$types === true) {
      result.push(...listTemplateTypes(item, path));
    } else {
      result.push(path);
    }
  }
  return result;
}

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

export async function runDefinitionTest() {
  (globalThis as any).__APP_VERSION__ = "definition-test";
  const d = await import("@shared/projectData/definitions");
  const { PayloadVariants } = await import("@shared/projectData/typePayload");
  const { PayloadTemplates } = await import("@shared/projectData/typePayload/templates");

  runCase("create(discriminant, overrides, registerOwned) equals the object form", () => {
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

  runCase("createVariantPayload creates the payload of a case", () => {
    const createPayload = (name: keyof typeof PayloadVariants, type: string, ...rest: unknown[]) =>
      d.createVariantPayload(PayloadVariants[name], type, ...(rest as [unknown, never]));
    assert.deepEqual(createPayload("step", "Audio.play", { volume: 3 }), {
      resourceId: null,
      channel: "default",
      volume: 3,
      loop: false
    });
    assert.equal(createPayload("step", "Audio"), null);
    assert.equal(createPayload("listener", "input"), null);
    const { log, registerOwned } = createOwnedRecorder();
    assert.deepEqual(createPayload("element", "plugin", undefined, registerOwned), {
      plugin: "owned-0"
    });
    assert.equal(log[0].type, "pluginPointers");
  });

  runCase("payload templates list the same types as the definitions", () => {
    for (const [name, variant] of Object.entries(PayloadVariants)) {
      assert.deepEqual(
        d.listVariantCases(variant.cases).map(([type]) => type),
        listTemplateTypes((PayloadTemplates as AnyRecord)[name]),
        name
      );
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

  runCase("owned relation without registerOwned throws", () => {
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
