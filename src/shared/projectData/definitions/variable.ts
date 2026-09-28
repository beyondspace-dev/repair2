import { defineProjectData, field } from "./core";

export const VariableDefinition = defineProjectData("variables", {
  id: field.id(),
  name: field.string(null),
  defaultValue: field.string(null)
});
