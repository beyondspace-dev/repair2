import { defineData, field, nested, relation } from "./core";
import { ScreenConfigDefinition } from "./screenConfig";

export const ConfigDefinition = defineData({
  title: field.string("REPAIR v2"),
  width: field.number(null),
  height: field.number(null),
  sizeRatio: field.json<string | number | null>(1),
  filter: field.string(null),
  style: field.string(null),
  screenConfig: nested(ScreenConfigDefinition),
  transparent: field.boolean(false),
  runtimePlugins: relation.many("pluginPointers", { kind: "ref" })
});
