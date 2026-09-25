import { defineProjectData, field, relation, variant } from "./core";

export const ValueDefinition = defineProjectData("values", {
  baseType: variant(
    { variable: { baseValue: relation.one("variables", { kind: "ref" }) } },
    { default: "string", open: { baseValue: field.string(null) } }
  ),
  process: relation.many("valueProcesses", { kind: "own" })
});
