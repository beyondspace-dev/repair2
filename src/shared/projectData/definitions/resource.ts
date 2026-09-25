import { defineProjectData, field } from "./core";

export const ResourceDefinition = defineProjectData("resources", {
  id: field.id(),
  src: field.string(null),
  alias: field.string(null)
});
