/**
 * TypeScript types of ProjectData, all inferred from the definitions.
 */
import type { ComponentDefinition } from "./component";
import type { ConfigDefinition } from "./config";
import type { InferData } from "./core";
import type { CoordDefinition } from "./coord";
import type { ElementDefinition } from "./element";
import type { ListenerDefinition } from "./listener";
import type { NodeDefinition } from "./node";
import type { PluginPointerDefinition } from "./pluginPointer";
import type { PositionDefinition } from "./position";
import type { ProjectDefinition } from "./project";
import type { ResourceDefinition } from "./resource";
import type { ScreenConfigDefinition } from "./screenConfig";
import type { StepDefinition } from "./step";
import type { TransitionDefinition } from "./transition";
import type { ValueDefinition } from "./value";
import type { ValueProcessDefinition } from "./valueProcess";
import type { VariableDefinition } from "./variable";
import type { ViewportDefinition } from "./viewport";

export type { DragOption, EnabledDragOption } from "./dragOption";

export type Position = InferData<typeof PositionDefinition>;
export type Coord = InferData<typeof CoordDefinition>;
export type Transition = InferData<typeof TransitionDefinition>;
export type ViewportData = InferData<typeof ViewportDefinition>;
export type ScreenConfigData = InferData<typeof ScreenConfigDefinition>;
export type ProjectConfig = InferData<typeof ConfigDefinition>;

export type Resource = InferData<typeof ResourceDefinition>;
export type Variable = InferData<typeof VariableDefinition>;
export type PluginPointer = InferData<typeof PluginPointerDefinition>;
export type Component = InferData<typeof ComponentDefinition>;
export type Element = InferData<typeof ElementDefinition>;
export type Listener = InferData<typeof ListenerDefinition>;
export type ValueProcess = InferData<typeof ValueProcessDefinition>;
export type Value = InferData<typeof ValueDefinition>;
export type Step = InferData<typeof StepDefinition>;

export type Node = InferData<typeof NodeDefinition>;
export type Entry = Extract<Node, { nodeType: "entry" }>;
export type Sequence = Extract<Node, { nodeType: "sequence" }>;
export type Branch = Extract<Node, { nodeType: "branch" }>;
export type VariableSet = Extract<Node, { nodeType: "variableSet" }>;

/** The whole stored ProjectData */
export type Data = InferData<typeof ProjectDefinition>;
