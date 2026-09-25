/**
 * Compile-time checks for the definition core. Verify with `tsc -p src/main/tsconfig.json`.
 */
import {
  ComponentDefinition,
  ConfigDefinition,
  CoordDefinition,
  ElementDefinition,
  ListenerDefinition,
  NodeDefinition,
  ProjectDefinition,
  PluginPointerDefinition,
  PositionDefinition,
  ResourceDefinition,
  ScreenConfigDefinition,
  StepDefinition,
  TransitionDefinition,
  ValueDefinition,
  ValueProcessDefinition,
  VariableDefinition,
  ViewportDefinition,
  defineProjectData,
  field,
  type InferData
} from "@shared/projectData/definitions";
import type { RegisterOwned } from "@shared/projectData/definitions";
import type { Types } from "@shared/projectData/types";

declare const registerOwned: RegisterOwned;

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Expect<T extends true> = T;

export type TypeEquality = [
  Expect<Equal<InferData<typeof PositionDefinition>, Types.Position>>,
  Expect<Equal<InferData<typeof CoordDefinition>, Types.Coord>>,
  Expect<Equal<InferData<typeof VariableDefinition>, Types.Variable>>,
  Expect<Equal<InferData<typeof ResourceDefinition>, Types.Resource>>,
  Expect<Equal<InferData<typeof PluginPointerDefinition>, Types.PluginPointer>>,
  Expect<Equal<InferData<typeof TransitionDefinition>, Types.Transition>>,
  Expect<Equal<InferData<typeof ViewportDefinition>, Types.ViewportData>>,
  Expect<Equal<InferData<typeof ComponentDefinition>, Types.Component>>,
  Expect<Equal<InferData<typeof ValueProcessDefinition>, Types.ValueProcess>>,
  Expect<Equal<InferData<typeof ListenerDefinition>, Types.Listener>>,
  Expect<Equal<InferData<typeof ElementDefinition>, Types.Element>>,
  Expect<Equal<InferData<typeof ScreenConfigDefinition>, Types.ScreenConfigData>>,
  Expect<Equal<InferData<typeof ConfigDefinition>, Types.ProjectConfig>>,
  Expect<Equal<InferData<typeof StepDefinition>, Types.Step>>,
  Expect<Equal<InferData<typeof ValueDefinition>, Types.Value>>,
  Expect<Equal<InferData<typeof NodeDefinition>, Types.Node>>,
  Expect<Equal<InferData<typeof ProjectDefinition>, Types.Data>>
];

TransitionDefinition.create({ plugin: "existing-plugin" });
TransitionDefinition.create(undefined, registerOwned);
// @ts-expect-error An owned plugin must be registered when its ID is not overridden.
TransitionDefinition.create();
// @ts-expect-error An empty override still needs an owned plugin.
TransitionDefinition.create({});

ComponentDefinition.create({
  frame: "frame-plugin",
  introTransition: { plugin: "intro-plugin" },
  outroTransition: { plugin: "outro-plugin" }
});
ComponentDefinition.create(undefined, registerOwned);
ComponentDefinition.create({ pos: { x: { origin: "end" } } }, registerOwned);
// @ts-expect-error Both nested transitions create owned plugin pointers by default.
ComponentDefinition.create();
// @ts-expect-error Nested override values keep their field types.
ComponentDefinition.create({ pos: { x: { origin: "left" } } }, registerOwned);

PluginPointerDefinition.create();
PositionDefinition.create({ distance: 1 });

const audio = StepDefinition.create("Audio.play", { payload: { volume: 50 } });
export const audioVolume: number | null = audio.payload.volume;
const video = ElementDefinition.create("video");
export const videoLoop: boolean = video.payload.loop;
const trim = ValueProcessDefinition.create("trim");
export const trimPayload: string | number | null = trim.payload;
const emptyStep = StepDefinition.create("");
export const emptyPayload: null = emptyStep.payload;

StepDefinition.create("Component.create", { payload: { componentId: "existing" } });
StepDefinition.create("Component.create", undefined, registerOwned);
// @ts-expect-error Component.create requires registration when componentId is missing.
StepDefinition.create("Component.create");
// @ts-expect-error Component.create requires registration when componentId is missing.
StepDefinition.create("Component.create", { title: "t" });
// @ts-expect-error Unknown step types are rejected.
StepDefinition.create("Audio.nope");
// @ts-expect-error A group itself is not a step type.
StepDefinition.create("Audio");
// @ts-expect-error Unknown top-level keys are rejected.
StepDefinition.create("Audio.play", { foo: 1 });
// @ts-expect-error Payload fields of another case are rejected.
StepDefinition.create("Audio.play", { payload: { delayMs: 1 } });
// @ts-expect-error Payload value types are checked.
StepDefinition.create("Audio.play", { payload: { loop: "yes" } });
// @ts-expect-error The discriminant is given as the first argument, not inside overrides.
StepDefinition.create("Audio.play", { type: "delay" });

ElementDefinition.create("plugin", { payload: { plugin: "existing-plugin" } });
ElementDefinition.create("plugin", undefined, registerOwned);
// @ts-expect-error A plugin element requires registration when plugin is missing.
ElementDefinition.create("plugin");
ListenerDefinition.create("input", { payload: "typed text" });

StepDefinition.create();
StepDefinition.create({ type: "Audio.play", payload: { volume: 1 } });
StepDefinition.create({ type: "Component.create" }, registerOwned);
// @ts-expect-error Component.create requires registration when componentId is missing.
StepDefinition.create({ type: "Component.create" });
// @ts-expect-error Unknown top-level keys are rejected.
StepDefinition.create({ type: "Audio.play", foo: 1 });
// @ts-expect-error Payload fields of another case are rejected.
StepDefinition.create({ type: "Audio.play", payload: { delayMs: 1 } });
ListenerDefinition.create();
ValueProcessDefinition.create({ type: "replaceAll", payload: { from: "a" } });

NodeDefinition.create();
const sequence = NodeDefinition.create("sequence", { steps: ["s"] });
export const sequenceSteps: string[] = sequence.steps;
NodeDefinition.create("branch", { valueA: "value-a", valueB: "value-b" });
NodeDefinition.create("branch", undefined, registerOwned);
// @ts-expect-error Branch values are owned and must be registered when absent.
NodeDefinition.create("branch");
// @ts-expect-error A variable-set value must be registered when absent.
NodeDefinition.create("variableSet");
// @ts-expect-error Fields of another node type are rejected.
NodeDefinition.create("sequence", { operator: "equals" });
// @ts-expect-error Fields of another node type are rejected.
NodeDefinition.create({ nodeType: "sequence", operator: "equals" });
// @ts-expect-error Branch values are owned and must be registered when absent.
NodeDefinition.create({ nodeType: "branch" });

const entry = NodeDefinition.create("entry", { type: "shortcut", payload: { key: "K" } });
export const entryStandby: boolean = entry.standbyMode;
// @ts-expect-error Payload fields of another entry type are rejected.
NodeDefinition.create("entry", { type: "shortcut", payload: { channel: "x" } });
// @ts-expect-error Unknown entry types are rejected.
NodeDefinition.create("entry", { type: "nope" });

ValueDefinition.create();
const variableValue = ValueDefinition.create("variable", { baseValue: "var-1" });
export const variableBaseType: "variable" = variableValue.baseType;
const customValue = ValueDefinition.create("number");
export const customBaseType: "number" = customValue.baseType;

// @ts-expect-error A missing field is rejected.
defineProjectData("variables", {
  id: field.id(),
  name: field.string(null)
});
// @ts-expect-error A field with a different type is rejected.
defineProjectData("resources", {
  id: field.id(),
  src: field.number(null),
  alias: field.string(null)
});
