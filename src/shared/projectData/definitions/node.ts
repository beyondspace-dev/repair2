import { defineProjectData, field, group, relation, variant } from "./core";

const output = () => relation.one("nodes", { kind: "ref" });

export const NodeDefinition = defineProjectData("nodes", {
  id: field.id(),
  alias: field.string(null),
  nodePos: field.json(() => ({ x: 0, y: 0 })),
  nodeType: variant(
    {
      entry: {
        output: output(),
        standbyMode: field.boolean(false),
        type: variant(
          {
            startup: null,
            Communication: group({
              Socket: group({
                ondata: { channel: field.string(null), data: field.string(null) },
                connect: null
              }),
              serialData: { whenDataIs: field.string(null) },
              Mqtt: group({
                ondata: { topic: field.string(null), data: field.string(null) },
                connect: null
              })
            }),
            shortcut: {
              ctrlKey: field.boolean(true),
              shiftKey: field.boolean(true),
              altKey: field.boolean(false),
              metaKey: field.boolean(false),
              pressingTime: field.number(0, { nullable: true }),
              key: field.string(null)
            },
            event: { channel: field.string(null) }
          },
          { payload: "payload", default: "startup" }
        )
      },
      sequence: {
        folded: field.boolean(false),
        inputColor: field.string("#000"),
        steps: relation.many("steps", { kind: "own" }),
        output: output(),
        concurrency: field.enum(["allow", "skip"], "allow")
      },
      branch: {
        valueA: relation.one("values", { kind: "own", create: true }),
        valueB: relation.one("values", { kind: "own", create: true }),
        operator: field.enum(
          ["equals", "includes", "gt", "lt", "gte", "lte", "jsFunction"],
          "equals"
        ),
        scriptData: field.string(null),
        trueOutput: output(),
        falseOutput: output(),
        disableAfterTrue: field.boolean(false),
        disableAfterFalse: field.boolean(false)
      },
      variableSet: {
        folded: field.boolean(false),
        inputColor: field.string("#000"),
        variable: relation.one("variables", { kind: "ref" }),
        value: relation.one("values", { kind: "own", create: true }),
        output: output()
      }
    },
    { default: "sequence", fallback: "sequence" }
  )
});
