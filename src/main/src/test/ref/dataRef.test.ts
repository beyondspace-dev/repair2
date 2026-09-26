/**
 * Runtime checks for DataRef address helpers.
 *
 * Run: npx tsx --tsconfig src/main/tsconfig.json src/main/src/test/ref/dataRef.test.ts
 */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dataTargetKey, readDataPath, type DataRef } from "@shared/projectData/ref";

function runCase(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

export function runDataRefTest() {
  runCase("dataTargetKey identifies records and the config", () => {
    assert.equal(dataTargetKey({ kind: "record", type: "components", id: "c1" }), "components:c1");
    assert.equal(dataTargetKey({ kind: "config" }), "config");
  });

  runCase("readDataPath follows object keys and array indexes", () => {
    const root = { pos: { x: { distance: 10 } }, elements: ["e1", "e2"] };
    assert.equal(readDataPath(root, ["pos", "x", "distance"]), 10);
    assert.equal(readDataPath(root, ["elements", 1]), "e2");
    assert.equal(readDataPath(root, []), root);
  });

  runCase("a DataRef can address structural data", () => {
    const ref: DataRef = {
      target: { kind: "record", type: "nodes", id: "n1" },
      path: ["steps", 0]
    };
    assert.equal(readDataPath({ steps: ["s1"] }, ref.path), "s1");
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath && resolve(fileURLToPath(import.meta.url)) === invokedPath) {
  runDataRefTest();
}
