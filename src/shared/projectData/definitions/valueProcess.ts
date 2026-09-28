import { defineProjectData, field, variant } from "./core";

export const ValueProcessDefinition = defineProjectData("valueProcesses", {
  id: field.id(),
  type: variant(
    {
      trim: null,
      replaceAll: {
        from: field.string("", { nullable: true }),
        to: field.string("", { nullable: true })
      },
      removeAll: { removing: field.string("", { nullable: true }) },
      replaceAllRegex: {
        regex: field.string("", { nullable: true }),
        to: field.string("", { nullable: true })
      },
      toLowerCase: null,
      toUpperCase: null,
      length: null,
      koToEn: null,
      enToKo: null,
      jsFunction: { scriptData: field.json<string | number | null>(null) }
    },
    { payload: "payload", default: "" }
  )
});
