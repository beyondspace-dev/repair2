import type { Types } from "@shared/projectData/types";
import type { NodeController } from "../types";
import { ref } from "../refs";
import { getGoto } from "./output";
import { Base } from "../base";
import { compileFunction } from "../../lib/compileScript";

const compareMap: Record<
  Exclude<Types.Branch["operator"], "jsFunction">,
  (a: string, b: string) => boolean
> = {
  equals: (a, b) => a == b,
  includes: (a, b) => a.includes(b),
  gt: (a, b) => +a > +b,
  lt: (a, b) => +a < +b,
  gte: (a, b) => +a >= +b,
  lte: (a, b) => +a <= +b
};
const alwaysFalse = () => false;

function compileCompare(d: Types.Branch): (a: string, b: string) => boolean {
  if (d.operator === "jsFunction") {
    return compileFunction(
      "Branch comparing JS function",
      d.scriptData,
      alwaysFalse,
      "valueA",
      "valueB"
    );
  }
  return compareMap[d.operator] ?? alwaysFalse;
}

export class Branch extends Base<Types.Branch> implements NodeController {
  private valueARef = ref("values", this.d.valueA);
  private valueBRef = ref("values", this.d.valueB);
  private gotoT = getGoto(this.d.trueOutput);
  private gotoF = getGoto(this.d.falseOutput);
  private compare: (a: string, b: string) => boolean = compileCompare(this.d);

  get checkCondition() {
    const valueA = this.valueARef?.();
    const valueB = this.valueBRef?.();
    return (
      valueA !== undefined &&
      valueB !== undefined &&
      this.compare(valueA.value ?? "", valueB.value ?? "")
    );
  }
  execute() {
    this.checkCondition ? this.gotoT?.() : this.gotoF?.();
  }
}
