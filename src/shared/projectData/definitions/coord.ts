import { defineData, nested } from "./core";
import { PositionDefinition } from "./position";

export const CoordDefinition = defineData({
  x: nested(PositionDefinition),
  y: nested(PositionDefinition)
});
