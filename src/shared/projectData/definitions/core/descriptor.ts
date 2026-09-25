import type { RecordKey } from "../../../constants";
import type { RegisterOwned } from "../../factories/factory";

export const DESCRIPTOR = Symbol("projectData.descriptor");
export const DEFINITION = Symbol("projectData.definition");

/** Compile-time only phantom key. It has no runtime value. */
declare const INFERRED: unique symbol;

export type Default<T> = T | (() => T);

/** Value type information available at runtime */
export type ValueSpec =
  | { readonly type: "string" }
  | { readonly type: "number" }
  | { readonly type: "boolean" }
  | { readonly type: "enum"; readonly values: readonly string[] }
  | { readonly type: "literal"; readonly value: string | number | boolean | null }
  | { readonly type: "json" };

/**
 * A regular field (`property: false`) or a Property (`property: true`).
 * Only Properties can be targeted by PropertyRef, Binding, and similar systems.
 */
export interface ValueDescriptor<T = unknown, P extends boolean = boolean> {
  readonly [DESCRIPTOR]: "value";
  readonly property: P;
  readonly spec: ValueSpec;
  readonly nullable: boolean;
  readonly isId: boolean;
  readonly default: Default<T>;
  readonly [INFERRED]?: T;
}

export interface NestedDescriptor<D extends AnyDataDefinition = AnyDataDefinition> {
  readonly [DESCRIPTOR]: "nested";
  readonly definition: D;
}

export type RelationCardinality = "one" | "many";
export type RelationKind = "own" | "ref";

/**
 * ID of another project record.
 * When `creates` is true and there is no override, a record is created from the target definition and registered with registerOwned.
 * The target definition is looked up lazily from the registry at creation time.
 */
export interface RelationDescriptor<
  K extends RecordKey = RecordKey,
  C extends RelationCardinality = RelationCardinality,
  Kind extends RelationKind = RelationKind,
  T = unknown,
  Creates extends boolean = boolean
> {
  readonly [DESCRIPTOR]: "relation";
  readonly target: K;
  readonly cardinality: C;
  readonly kind: Kind;
  readonly creates: Creates;
  readonly default: Default<T>;
  readonly [INFERRED]?: T;
}

/**
 * A value whose structure is not expressed with the DSL. Uses an existing factory function as is.
 * Has no relation / property metadata.
 */
export interface CustomDescriptor<T = unknown> {
  readonly [DESCRIPTOR]: "custom";
  readonly create: (
    overrides: Record<string, unknown> | undefined,
    registerOwned?: RegisterOwned
  ) => T;
  readonly [INFERRED]?: T;
}

/** Variant case hierarchy. The stored discriminant has the `Group.case` format. */
export interface GroupDescriptor<C extends VariantCases = VariantCases> {
  readonly [DESCRIPTOR]: "group";
  readonly cases: C;
}

/** Field shape of a case. In payload mode, null is a case whose payload is null. */
export type VariantCase = Shape | null | GroupDescriptor<any>;
export type VariantCases = { readonly [name: string]: VariantCase };

/**
 * A variant declared in place of its discriminant field.
 * - payload mode (`payloadKey` set): case fields are placed under `payloadKey`. (type-payload)
 * - flat mode: case fields are spread into the parent object. (nodeType, baseType)
 */
export interface VariantDescriptor<
  C extends VariantCases = VariantCases,
  P extends string | null = string | null,
  Open extends Shape | null = Shape | null,
  D extends string = string
> {
  readonly [DESCRIPTOR]: "variant";
  readonly cases: C;
  readonly payloadKey: P;
  readonly default: D;
  /** flat mode: case name used for an unknown discriminant */
  readonly fallback: string | null;
  /** flat mode: shape used for an unknown discriminant (the discriminant type is string) */
  readonly open: Open;
}

export type AnyDescriptor =
  | ValueDescriptor<any, boolean>
  | NestedDescriptor<any>
  | RelationDescriptor<any, any, any, any, any>
  | CustomDescriptor<any>
  | VariantDescriptor<any, any, any, any>;

export type Shape = { readonly [key: string]: AnyDescriptor };

export interface DataDefinition<S extends Shape = Shape> {
  readonly [DEFINITION]: true;
  readonly shape: S;
}

export type AnyDataDefinition = DataDefinition<any>;

function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null;
}

export function isValueDescriptor(value: unknown): value is ValueDescriptor {
  return isObject(value) && value[DESCRIPTOR] === "value";
}

export function isNestedDescriptor(value: unknown): value is NestedDescriptor {
  return isObject(value) && value[DESCRIPTOR] === "nested";
}

export function isRelationDescriptor(value: unknown): value is RelationDescriptor {
  return isObject(value) && value[DESCRIPTOR] === "relation";
}

export function isCustomDescriptor(value: unknown): value is CustomDescriptor {
  return isObject(value) && value[DESCRIPTOR] === "custom";
}

export function isGroupDescriptor(value: unknown): value is GroupDescriptor {
  return isObject(value) && value[DESCRIPTOR] === "group";
}

export function isVariantDescriptor(value: unknown): value is VariantDescriptor {
  return isObject(value) && value[DESCRIPTOR] === "variant";
}

export function isDataDefinition(value: unknown): value is AnyDataDefinition {
  return isObject(value) && value[DEFINITION] === true;
}

export function resolveDefault<T>(value: Default<T>): T {
  return typeof value === "function" ? (value as () => T)() : value;
}
