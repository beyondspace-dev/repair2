import { CoordDefinition } from "./coord";
import { defineProjectData, field, nested, relation, variant } from "./core";
import { dragOption } from "./dragOption";

export const ElementDefinition = defineProjectData("elements", {
  id: field.id(),
  alias: field.string(null),
  width: field.number(null),
  height: field.number(null),
  style: field.string(null),
  childStyle: field.string(null),
  className: field.string(null),
  pos: nested(CoordDefinition),
  absolute: field.boolean(false),
  fullscreen: field.boolean(false),
  listeners: relation.many("listeners", { kind: "own" }),
  dragOption: dragOption(),
  type: variant(
    {
      empty: { content: field.string(null), isHtml: field.boolean(false) },
      image: {
        resourceId: relation.one("resources", { kind: "ref" }),
        removePreload: field.boolean(true)
      },
      video: {
        resourceId: relation.one("resources", { kind: "ref" }),
        removePreload: field.boolean(true),
        loop: field.boolean(false),
        volume: field.number(100, { nullable: true })
      },
      input: {
        variableId: relation.one("variables", { kind: "ref" }),
        placeholder: field.string(null),
        autofocus: field.boolean(false),
        maxLength: field.number(null),
        allowedType: field.string("any", { nullable: true }),
        allowedRegex: field.string(null),
        valueFunction: field.string(null),
        isTextarea: field.boolean(false)
      },
      advancedInput: {
        variableId: relation.one("variables", { kind: "ref" }),
        maxLength: field.number(null),
        securityText: field.string(null)
      },
      plugin: { plugin: relation.one("pluginPointers", { kind: "own", create: true }) }
    },
    { payload: "payload", default: "empty" }
  )
});
