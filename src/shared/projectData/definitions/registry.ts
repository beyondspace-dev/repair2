import { ComponentDefinition } from "./component";
import { ElementDefinition } from "./element";
import { ListenerDefinition } from "./listener";
import { NodeDefinition } from "./node";
import { PluginPointerDefinition } from "./pluginPointer";
import { ResourceDefinition } from "./resource";
import { StepDefinition } from "./step";
import { ValueDefinition } from "./value";
import { ValueProcessDefinition } from "./valueProcess";
import { VariableDefinition } from "./variable";

/**
 * All project record definitions.
 * Importing this module registers every definition needed for lazy lookup of owned relations.
 */
export const ProjectDefinitions = {
  resources: ResourceDefinition,
  variables: VariableDefinition,
  nodes: NodeDefinition,
  steps: StepDefinition,
  components: ComponentDefinition,
  elements: ElementDefinition,
  listeners: ListenerDefinition,
  valueProcesses: ValueProcessDefinition,
  pluginPointers: PluginPointerDefinition,
  values: ValueDefinition
} as const;
