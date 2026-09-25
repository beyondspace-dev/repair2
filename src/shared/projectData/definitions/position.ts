import { defineData, prop } from "./core";

export const PositionDefinition = defineData({
  distance: prop.number(null),
  origin: prop.enum(["start", "center", "end"], "start"),
  relative: prop.boolean(false)
});
