import { defineData, field, relation } from "./core";

export const TransitionDefinition = defineData({
  duration: field.number(400),
  easing: field.string("linear"),
  delay: field.number(0),
  plugin: relation.one("pluginPointers", { kind: "own", create: true })
});
