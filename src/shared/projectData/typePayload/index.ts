import {
  ElementDefinition,
  ListenerDefinition,
  NodeDefinition,
  ScreenConfigDefinition,
  StepDefinition,
  ValueProcessDefinition,
  type VariantDescriptor
} from "../definitions";
import type { TypePayloadMap } from "./templates/types";

export * from "./templates";
export type * from "./templates/types";

/** Payload variant of each type-payload structure */
export const PayloadVariants: Record<keyof TypePayloadMap, VariantDescriptor> = {
  element: ElementDefinition.shape.type,
  entry: NodeDefinition.shape.nodeType.cases.entry.type,
  listener: ListenerDefinition.shape.type,
  screenConfig: ScreenConfigDefinition.shape.type,
  step: StepDefinition.shape.type,
  valueProcess: ValueProcessDefinition.shape.type
} as Record<keyof TypePayloadMap, VariantDescriptor>;
