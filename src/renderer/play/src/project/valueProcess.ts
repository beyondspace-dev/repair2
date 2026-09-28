import type { Types } from "@shared/projectData/types";
import { enToKo, koToEn } from "../lib/enKoConvert";
import { compileFunction, compileRegex } from "../lib/compileScript";

type CompileRequired = "jsFunction" | "replaceAllRegex" | "replaceAll" | "removeAll";

const processMap: Record<
  Exclude<Types.ValueProcess["type"], CompileRequired | "">,
  (str: string) => string
> = {
  toLowerCase: (s) => s.toLowerCase(),
  toUpperCase: (s) => s.toUpperCase(),
  trim: (s) => s.trim(),
  length: (s) => String(s.length),
  enToKo: (s) => enToKo(s),
  koToEn: (s) => koToEn(s)
};
const pass = <T>(s: T) => s;

export function compileValueProcess(vp: Types.ValueProcess | undefined): (str: string) => string {
  if (!vp || !vp.type) return pass;
  if (vp.type === "jsFunction") {
    return compileFunction("Value process JS function", vp.payload.scriptData, pass, "value");
  }
  if (vp.type === "removeAll") return (str) => str.replaceAll(vp.payload.removing ?? "", "");
  if (vp.type === "replaceAll")
    return (str) => str.replaceAll(vp.payload.from ?? "", vp.payload.to ?? "");
  if (vp.type === "replaceAllRegex") {
    const r = compileRegex("Value process replaceAll regex", vp.payload.regex, "g");
    return (str) => str.replace(r, vp.payload.to ?? "");
  }
  return processMap[vp.type] ?? pass;
}

export type CompiledProcess = ReturnType<typeof compileValueProcess>;
