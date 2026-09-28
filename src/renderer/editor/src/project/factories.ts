import type { RecordKey, RecordValue } from "@shared/constants";
import {
  ComponentDefinition,
  ElementDefinition,
  ListenerDefinition,
  NodeDefinition,
  PluginPointerDefinition,
  ResourceDefinition,
  StepDefinition,
  ValueDefinition,
  ValueProcessDefinition,
  VariableDefinition,
  type RegisterOwned
} from "@shared/projectData/definitions";
import { nanoid } from "nanoid";
import { getMutator } from "./store";

function recordId(data: object): string {
  return "id" in data && typeof data.id === "string" ? data.id : nanoid();
}

type DefaultFactory<K extends RecordKey> = (
  overrides: undefined,
  registerOwned: RegisterOwned
) => RecordValue<K>;

function createEditorFactory<K extends RecordKey>(
  type: K,
  factory: DefaultFactory<K>
): () => string {
  return () => {
    const mutator = getMutator();
    return mutator.transaction(() => {
      const registerOwned: RegisterOwned = (ownedType, data) => {
        const id = recordId(data);
        return mutator.add(ownedType, id, data);
      };

      const data = factory(undefined, registerOwned);
      const id = recordId(data);
      return mutator.add(type, id, data);
    });
  };
}

type NodeData = RecordValue<"nodes">;
type NodePosition = NodeData["nodePos"];

function createEditorNodeFactory(
  factory: (nodePos: NodePosition, registerOwned: RegisterOwned) => NodeData
): (nodePos: NodePosition) => string {
  return (nodePos) => {
    const mutator = getMutator();
    return mutator.transaction(() => {
      const registerOwned: RegisterOwned = (ownedType, data) => {
        const id = recordId(data);
        return mutator.add(ownedType, id, data);
      };

      const data = factory(nodePos, registerOwned);
      return mutator.add("nodes", data.id, data);
    });
  };
}

export const Factories = {
  resource: createEditorFactory("resources", ResourceDefinition.create),
  variable: createEditorFactory("variables", VariableDefinition.create),
  node: {
    entry: createEditorNodeFactory((nodePos, registerOwned) =>
      NodeDefinition.create("entry", { nodePos }, registerOwned)
    ),
    sequence: createEditorNodeFactory((nodePos, registerOwned) =>
      NodeDefinition.create("sequence", { nodePos }, registerOwned)
    ),
    branch: createEditorNodeFactory((nodePos, registerOwned) =>
      NodeDefinition.create("branch", { nodePos }, registerOwned)
    ),
    variableSet: createEditorNodeFactory((nodePos, registerOwned) =>
      NodeDefinition.create("variableSet", { nodePos }, registerOwned)
    )
  },
  step: createEditorFactory("steps", StepDefinition.create),
  component: createEditorFactory("components", ComponentDefinition.create),
  element: createEditorFactory("elements", ElementDefinition.create),
  listener: createEditorFactory("listeners", ListenerDefinition.create),
  valueProcess: createEditorFactory("valueProcesses", ValueProcessDefinition.create),
  pluginPointer: createEditorFactory("pluginPointers", PluginPointerDefinition.create),
  value: createEditorFactory("values", ValueDefinition.create)
} as const;
