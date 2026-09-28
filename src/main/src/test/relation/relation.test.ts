/**
 * Runtime checks for relation helpers derived from the ProjectData definitions.
 *
 * Run: npx tsx --tsconfig src/main/tsconfig.json src/main/src/test/relation/relation.test.ts
 */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function runCase(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

export async function runRelationTest() {
  (globalThis as any).__APP_VERSION__ = "relation-test";
  const { findOwners, rewriteRelationIds } = await import("@shared/projectData/relation");

  runCase("findOwners lists owning fields with their variant case", () => {
    assert.deepEqual(findOwners("steps"), [
      { type: "nodes", case: "sequence", path: ["steps"], cardinality: "many" }
    ]);
    assert.deepEqual(findOwners("listeners"), [
      { type: "elements", case: null, path: ["listeners"], cardinality: "many" }
    ]);
    assert.deepEqual(findOwners("valueProcesses"), [
      { type: "values", case: null, path: ["process"], cardinality: "many" }
    ]);
    assert.deepEqual(findOwners("components"), [
      {
        type: "steps",
        case: "Component.create",
        path: ["payload", "componentId"],
        cardinality: "one"
      }
    ]);
    assert.deepEqual(
      findOwners("values").map(({ type, case: caseName, path }) => [
        type,
        caseName,
        path.join(".")
      ]),
      [
        ["nodes", "branch", "valueA"],
        ["nodes", "branch", "valueB"],
        ["nodes", "variableSet", "value"]
      ]
    );
    assert.deepEqual(findOwners("resources"), []);
  });

  runCase("rewriteRelationIds rewrites ids in place, including arrays and payloads", () => {
    const sequence = {
      nodeType: "sequence",
      steps: ["s1", "s2"],
      output: "n1"
    };
    rewriteRelationIds("nodes", sequence as never, (type, id) =>
      type === "steps" ? `new-${id}` : null
    );
    assert.deepEqual(sequence, { nodeType: "sequence", steps: ["new-s1", "new-s2"], output: null });

    const step = { type: "Preload.add", payload: { resourceArr: ["r1"] } };
    rewriteRelationIds("steps", step as never, (_, id) => `${id}!`);
    assert.deepEqual(step.payload.resourceArr, ["r1!"]);

    const delay = { type: "delay", payload: { delayMs: 1 } };
    rewriteRelationIds("steps", delay as never, () => "changed");
    assert.deepEqual(delay, { type: "delay", payload: { delayMs: 1 } });
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath && resolve(fileURLToPath(import.meta.url)) === invokedPath) {
  await runRelationTest();
}
