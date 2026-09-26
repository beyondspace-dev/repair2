import {
  ElementDefinition,
  ListenerDefinition,
  NodeDefinition,
  ScreenConfigDefinition,
  StepDefinition,
  ValueProcessDefinition,
  type VariantDescriptor
} from "../definitions";
import type {
  Element,
  Entry,
  Listener,
  ScreenConfigData,
  Step,
  ValueProcess
} from "../definitions/types";

/** Union that keeps only the `type` + `payload` part */
type TypePayloadOf<T> = T extends unknown
  ? Pick<T, ("type" & keyof T) | ("payload" & keyof T)>
  : never;

export type ElementTypePayload = TypePayloadOf<Element>;
export type EntryTypePayload = TypePayloadOf<Entry>;
export type ListenerTypePayload = TypePayloadOf<Listener>;
export type ScreenConfigTypePayload = ScreenConfigData;
export type StepTypePayload = TypePayloadOf<Step>;
export type ValueProcessTypePayload = TypePayloadOf<ValueProcess>;

export type TypePayloadMap = {
  element: ElementTypePayload;
  entry: EntryTypePayload;
  listener: ListenerTypePayload;
  screenConfig: ScreenConfigTypePayload;
  step: StepTypePayload;
  valueProcess: ValueProcessTypePayload;
};

export type TypePayloads = TypePayloadMap[keyof TypePayloadMap];

/** Payload variant of each type-payload structure */
export const PayloadVariants: Record<keyof TypePayloadMap, VariantDescriptor> = {
  element: ElementDefinition.shape.type,
  entry: NodeDefinition.shape.nodeType.cases.entry.type,
  listener: ListenerDefinition.shape.type,
  screenConfig: ScreenConfigDefinition.shape.type,
  step: StepDefinition.shape.type,
  valueProcess: ValueProcessDefinition.shape.type
} as Record<keyof TypePayloadMap, VariantDescriptor>;
