import { CoordDefinition } from "./coord";
import { defineProjectData, field, nested, prop, relation } from "./core";
import { TransitionDefinition } from "./transition";

export const ComponentDefinition = defineProjectData("components", {
  id: field.id(),
  alias: field.string(null),
  elements: relation.many("elements", { kind: "own" }),
  pos: nested(CoordDefinition),
  zIndex: prop.number(null),
  unbreakable: field.boolean(false),
  visible: prop.boolean(true),
  style: prop.string(null),
  frame: relation.one("pluginPointers", { kind: "own", create: true }),
  introTransition: nested(TransitionDefinition),
  outroTransition: nested(TransitionDefinition)
});
