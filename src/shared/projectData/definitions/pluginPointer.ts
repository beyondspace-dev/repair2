import { defineProjectData, field } from "./core";

export const PluginPointerDefinition = defineProjectData("pluginPointers", {
  name: field.string(null),
  exportName: field.string("default", { nullable: true }),
  payloads: field.json<Record<string, string>>(() => ({}))
});
