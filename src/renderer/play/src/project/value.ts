import type { Types } from "@shared/projectData/types";
import { Base } from "./base";
import { ref } from "./refs";

export class Value extends Base<Types.Value> {
  private proccessRefs = this.d.process.map((id) => ref("valueProcesses", id));
  private varRef =
    this.d.baseType === "variable" && this.d.baseValue
      ? ref("variables", this.d.baseValue)
      : undefined;

  get value() {
    let r = this.baseValue;
    for (const processRef of this.proccessRefs) {
      const p = processRef();
      r = p ? p(r) : r;
    }
    return r;
  }
  get baseValue(): string {
    if (this.d.baseType === "string") return this.d.baseValue ?? "";
    if (this.d.baseType === "variable" && this.varRef) return this.varRef()?.value ?? "";
    return "";
  }
}
