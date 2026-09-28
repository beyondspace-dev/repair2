import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { convertToRuntime } from "../../../../../main/src/project/dataConvert/convertStoreData";
import type { RegisterOwned } from "@shared/projectData/definitions";
import { ProjectMutator } from "../../project/mutator";
import { ProjectInstance } from "../../project/project";
import { ClipboardOwnMap } from "./clipboard/constants";
import { getOutsFromNode } from "./connects";

function runCase(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve(fn()).then(() => console.log(`[PASS] ${name}`));
}

export async function runEditUtilsTest() {
  Object.assign(globalThis, { __APP_VERSION__: "edit-utils-test" });
  const {
    ComponentDefinition,
    ElementDefinition,
    ListenerDefinition,
    NodeDefinition,
    ProjectDefinition,
    StepDefinition
  } = await import("@shared/projectData/definitions");

  await runCase("clipboard owners are derived from owning id arrays", () => {
    assert.deepEqual(ClipboardOwnMap, {
      nodes: true,
      node: true,
      valueProcess: ["value", "process", "values"],
      step: ["sequence", "steps", "nodes"],
      element: ["component", "elements", "components"],
      listener: ["element", "listeners", "elements"]
    });
  });

  await runCase("node outputs include references from owned records", () => {
    const project = new ProjectInstance(convertToRuntime(ProjectDefinition.create()));
    const mutator = new ProjectMutator(project);
    let owned = 0;
    const registerOwned: RegisterOwned = (type, data) =>
      mutator.add(type, `owned-${owned++}`, data);

    mutator.transaction(() => {
      mutator.add(
        "listeners",
        "l1",
        ListenerDefinition.create({ id: "l1", output: "from-listener" })
      );
      mutator.add("listeners", "l2", ListenerDefinition.create({ id: "l2", output: null }));
      mutator.add(
        "elements",
        "e1",
        ElementDefinition.create({ id: "e1", listeners: ["l1", "l2"] }, registerOwned)
      );
      mutator.add(
        "components",
        "c1",
        ComponentDefinition.create({ id: "c1", elements: ["e1"] }, registerOwned)
      );
      mutator.add(
        "steps",
        "s1",
        StepDefinition.create("Component.create", { id: "s1", payload: { componentId: "c1" } })
      );
      mutator.add("steps", "s2", StepDefinition.create("delay", { id: "s2" }));
      mutator.add(
        "nodes",
        "seq",
        NodeDefinition.create("sequence", { id: "seq", steps: ["s1", "s2"], output: "next" })
      );
      mutator.add(
        "nodes",
        "branch",
        NodeDefinition.create(
          "branch",
          { id: "branch", trueOutput: "yes", falseOutput: "no" },
          registerOwned
        )
      );
      mutator.add("nodes", "entry", NodeDefinition.create("entry", { id: "entry", output: null }));
    });

    const outs = (id: string) =>
      [...getOutsFromNode(project.getUnsafe("nodes", id), project)].sort();
    assert.deepEqual(outs("seq"), ["from-listener", "next"]);
    assert.deepEqual(outs("branch"), ["no", "yes"]);
    assert.deepEqual(outs("entry"), []);
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath && resolve(fileURLToPath(import.meta.url)) === invokedPath) {
  await runEditUtilsTest();
}
