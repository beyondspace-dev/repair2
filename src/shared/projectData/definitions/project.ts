import { ConfigDefinition } from "./config";
import { defineData, field, nested, records } from "./core";
import { ProjectDefinitions } from "./registry";
import { ViewportDefinition } from "./viewport";

declare const __APP_VERSION__: string;

const {
  resources,
  variables,
  nodes,
  steps,
  components,
  elements,
  listeners,
  valueProcesses,
  pluginPointers,
  values
} = ProjectDefinitions;

/** The whole stored ProjectData. The stored format (version 2) is unchanged. */
export const ProjectDefinition = defineData({
  version: field.literal(2),
  appVersion: field.string(() => __APP_VERSION__),
  config: nested(ConfigDefinition),
  viewport: nested(ViewportDefinition),
  resources: records(resources),
  variables: records(variables),
  nodes: records(nodes),
  steps: records(steps),
  components: records(components),
  elements: records(elements),
  listeners: records(listeners),
  valueProcesses: records(valueProcesses),
  pluginPointers: records(pluginPointers),
  values: records(values),
  updatedAt: field.number(() => Date.now())
});
