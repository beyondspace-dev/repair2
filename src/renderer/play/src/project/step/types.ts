import type {
  GroupDescriptor,
  StepDefinition,
  VariantCases
} from "@shared/projectData/definitions";
import type { Types } from "@shared/projectData/types";

type Step = Types.Step;

type JoinPath<P extends string, K extends string> = P extends "" ? K : `${P}.${K}`;

/** Tree of step handlers that follows the step type hierarchy (groups) */
type StepActionTree<C, Prefix extends string = ""> = {
  [K in keyof C & string]: C[K] extends GroupDescriptor<infer G extends VariantCases>
    ? StepActionTree<G, JoinPath<Prefix, K>>
    : (step: Extract<Step, { type: JoinPath<Prefix, K> }>) => void | boolean | Promise<unknown>;
};

export type StepAction = StepActionTree<(typeof StepDefinition)["shape"]["type"]["cases"]>;
