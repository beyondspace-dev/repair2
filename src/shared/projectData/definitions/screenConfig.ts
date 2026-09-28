import { defineData, field, variant } from "./core";

export const ScreenConfigDefinition = defineData({
  type: variant(
    {
      fullscreen: null,
      fullMultiScreen: null,
      windowMode: {
        x: field.number(0, { nullable: true }),
        y: field.number(0, { nullable: true })
      }
    },
    { payload: "payload", default: "fullscreen" }
  )
});
