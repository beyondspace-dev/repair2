import { defineProjectData, field, group, relation, variant } from "./core";

export const ListenerDefinition = defineProjectData("listeners", {
  id: field.id(),
  repeatCount: field.number(1),
  repeatInterval: field.number(0),
  once: field.boolean(false),
  global: field.boolean(false),
  useCapture: field.boolean(false),
  output: relation.one("nodes", { kind: "ref" }),
  type: variant(
    {
      custom: { channel: field.string(null) },
      Mouse: group({ click: null, down: null, up: null }),
      input: null,
      keyPress: { key: field.string(null) },
      videoEnd: null,
      jsFunction: { channel: field.string(null), scriptData: field.string(null) },
      Drag: group({
        released: { hotspotIndexes: field.json<string | number | null>(null) },
        return: null
      }),
      plugin: {
        plugin: relation.one("pluginPointers", { kind: "own", create: true }),
        channel: field.string(null)
      }
    },
    { payload: "payload", default: "custom" }
  )
});
