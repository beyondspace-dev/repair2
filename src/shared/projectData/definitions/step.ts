import { defineProjectData, field, group, relation, variant } from "./core";

const channel = () => field.string("default", { nullable: true });
const volume = () => field.number(100, { nullable: true });

export const StepDefinition = defineProjectData("steps", {
  id: field.id(),
  title: field.string(null),
  type: variant(
    {
      Component: group({
        create: {
          componentId: relation.one("components", { kind: "own", create: true }),
          recreate: field.enum(["ignore", "allow"], "allow")
        },
        remove: { componentAlias: field.string(null), ignoreUnbreakable: field.boolean(true) },
        clear: { ignoreUnbreakable: field.boolean(false) },
        modify: {
          componentAlias: field.string(null),
          modifyKey: field.string(null),
          modifyValue: field.json<string | number | null>(null)
        }
      }),
      Preload: group({
        add: { resourceArr: relation.many("resources", { kind: "ref" }) },
        release: { resourceArr: relation.many("resources", { kind: "ref" }) },
        releaseAll: null
      }),
      Audio: group({
        play: {
          resourceId: relation.one("resources", { kind: "ref" }),
          channel: channel(),
          volume: volume(),
          loop: field.boolean(false)
        },
        pause: { channel: channel() },
        resume: { channel: channel() },
        changeVolume: {
          channel: channel(),
          volume: volume(),
          duration: field.number(0, { nullable: true })
        },
        reset: {}
      }),
      Communication: group({
        Serial: group({
          open: {
            portAlias: field.string(null),
            port: field.string(null),
            baudRate: field.number(9600, { nullable: true })
          },
          send: { data: field.string(null) },
          close: null
        }),
        Socket: group({
          connect: { url: field.string(null) },
          connectService: { type: field.string(null), name: field.string(null) },
          send: {
            channel: field.string(null),
            data: field.json<(string | number | null)[]>(() => [null])
          },
          disconnect: null
        }),
        Mqtt: group({
          connect: { url: field.string(null), topics: field.json<string[]>(() => []) },
          publish: { topic: field.string(null), payload: field.string(null) },
          disconnect: null
        })
      }),
      delay: { delayMs: field.number(0, { nullable: true }) },
      Others: group({
        customReset: {
          audios: field.boolean(true),
          variables: field.boolean(true),
          components: field.boolean(true),
          steps: field.boolean(true),
          preloads: field.boolean(true),
          entries: field.boolean(true),
          runtimePlugins: field.boolean(true)
        },
        setVariable: {
          variableId: relation.one("variables", { kind: "ref" }),
          value: field.json<string | number | null>(null)
        },
        resetAllVariables: null,
        executePlugin: {
          plugin: relation.one("pluginPointers", { kind: "own", create: true }),
          waitTillEnd: field.boolean(false)
        },
        runtimePluginStep: {
          pluginName: field.string(null),
          step: field.string(null),
          payloads: field.json<unknown>(() => ({})),
          waitTillEnd: field.boolean(false)
        },
        eventEmit: { channel: field.string(null), data: field.json<string | number | null>(null) },
        script: { code: field.string(null) },
        log: { content: field.string(null) }
      })
    },
    { payload: "payload", default: "" }
  )
});
