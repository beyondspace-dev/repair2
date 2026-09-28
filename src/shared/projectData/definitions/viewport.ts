import { defineData, field } from "./core";

export const ViewportDefinition = defineData({
  size: field.number(0),
  pos: field.json(() => ({ x: 0, y: 0 }))
});
