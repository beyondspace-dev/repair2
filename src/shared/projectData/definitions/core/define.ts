import type { RecordKey, RecordValue } from "../../../constants";
import type { RelationTree } from "../../relation/types";
import {
  DEFINITION,
  isCustomDescriptor,
  isNestedDescriptor,
  isRecordsDescriptor,
  isRelationDescriptor,
  isValueDescriptor,
  isVariantDescriptor,
  resolveDefault,
  type AnyDescriptor,
  type DataDefinition,
  type RelationDescriptor,
  type Shape,
  type ValueDescriptor,
  type VariantDescriptor,
  type RegisterOwned
} from "./descriptor";
import type { CreateFn } from "./infer.types";
import { collectProperties, type PropertyEntry } from "./property";
import { buildRelationTree } from "./relation";
import { lookupVariantCase, resolveFlatCase } from "./variant";

export interface Definition<S extends Shape> extends DataDefinition<S> {
  readonly create: CreateFn<S>;
  /** Relation tree in the RelationMap format */
  readonly relations: RelationTree;
  /** Properties declared with `prop.*` (including nested and variant cases) */
  readonly properties: readonly PropertyEntry[];
}

export interface ProjectDataDefinition<K extends RecordKey, S extends Shape> extends Definition<S> {
  readonly recordKey: K;
  /** ID field that receives the record map key. null for records without an ID field (pluginPointers, values) */
  readonly idKey: string | null;
}

/** Definition with type information erased, for runtime lookup */
type ErasedProjectDataDefinition = {
  readonly recordKey: RecordKey;
  readonly idKey: string | null;
  readonly shape: Shape;
  readonly create: (overrides?: unknown, registerOwned?: RegisterOwned) => object;
};

const projectDefinitions = new Map<RecordKey, ErasedProjectDataDefinition>();

/**
 * Looks up the target definition lazily when creating an owned relation.
 * Uses a map filled at registration time instead of imports to avoid circular imports between definition modules.
 */
export function getProjectDefinition(key: RecordKey): ErasedProjectDataDefinition {
  const definition = projectDefinitions.get(key);
  if (!definition) {
    throw new Error(
      `ProjectData definition for "${key}" is not loaded. Import definitions through "projectData/definitions".`
    );
  }
  return definition;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createOwned(
  descriptor: RelationDescriptor,
  override: unknown,
  registerOwned?: RegisterOwned
): string {
  if (typeof override === "string") return override;

  const type = descriptor.target;
  if (!registerOwned) {
    throw new Error(`registerOwned is required to create an owned ${type} record.`);
  }

  const data = getProjectDefinition(type).create(undefined, registerOwned);
  const registeredId = registerOwned(type, data as RecordValue<typeof type>);
  if (typeof registeredId === "string") return registeredId;
  if (registeredId !== undefined) {
    throw new Error(`registerOwned returned a non-string ID for an owned ${type} record.`);
  }

  if ("id" in data && typeof data.id === "string") return data.id;

  throw new Error(
    `registerOwned did not return an ID and the owned ${type} record has no string id.`
  );
}

function resolveDescriptor(
  descriptor: Exclude<AnyDescriptor, VariantDescriptor<any, any, any, any>>,
  override: unknown,
  registerOwned?: RegisterOwned
): unknown {
  if (isNestedDescriptor(descriptor)) {
    return createFromShape(
      descriptor.definition.shape,
      isRecord(override) ? override : undefined,
      registerOwned
    );
  }

  if (isCustomDescriptor(descriptor)) {
    return descriptor.create(isRecord(override) ? override : undefined, registerOwned);
  }

  if (isRecordsDescriptor(descriptor)) {
    if (!isRecord(override)) return {};
    const { definition } = descriptor;
    const create = definition.create as (
      overrides: unknown,
      registerOwned?: RegisterOwned
    ) => unknown;
    return Object.fromEntries(
      Object.entries(override).map(([key, item]) => {
        const itemOverride = isRecord(item) ? item : {};
        return [
          key,
          create(
            definition.idKey ? { ...itemOverride, [definition.idKey]: key } : itemOverride,
            registerOwned
          )
        ];
      })
    );
  }

  if (isRelationDescriptor(descriptor) && descriptor.creates) {
    return createOwned(descriptor, override, registerOwned);
  }

  if (override !== undefined) return override;
  return resolveDefault((descriptor as ValueDescriptor | RelationDescriptor).default);
}

/**
 * Creation rule for regular (non-payload) fields.
 * An override is used as is, regardless of its shape.
 */
export function createFromShape(
  shape: Shape,
  overrides?: Record<string, unknown>,
  registerOwned?: RegisterOwned,
  result: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const key in shape) {
    const descriptor = shape[key];
    if (isVariantDescriptor(descriptor)) {
      createVariant(key, descriptor as VariantDescriptor, overrides, registerOwned, result);
    } else {
      result[key] = resolveDescriptor(
        descriptor as Exclude<AnyDescriptor, VariantDescriptor<any, any, any, any>>,
        overrides?.[key],
        registerOwned
      );
    }
  }
  return result;
}

function createVariant(
  key: string,
  descriptor: VariantDescriptor,
  overrides: Record<string, unknown> | undefined,
  registerOwned: RegisterOwned | undefined,
  result: Record<string, unknown>
) {
  if (descriptor.payloadKey === null) {
    const value = overrides?.[key] !== undefined ? overrides[key] : descriptor.default;
    result[key] = value;
    const caseShape = resolveFlatCase(descriptor, value);
    if (caseShape) createFromShape(caseShape, overrides, registerOwned, result);
    return;
  }

  const value = overrides?.[key] ?? descriptor.default;
  result[key] = value;
  result[descriptor.payloadKey] = createVariantPayload(
    descriptor,
    value,
    overrides?.[descriptor.payloadKey] ?? undefined,
    registerOwned
  );
}

/** Creates the payload for a discriminant of a payload-mode variant. null for an unknown discriminant. */
export function createVariantPayload(
  descriptor: VariantDescriptor,
  value: unknown,
  override?: unknown,
  registerOwned?: RegisterOwned
): unknown {
  const caseShape = lookupVariantCase(descriptor, value);
  if (caseShape === undefined) return null;
  if (caseShape === null) return clonePayloadValue(null, override);
  return createPayloadShape(caseShape, override, registerOwned);
}

/**
 * Creation rule for payload fields.
 * - Primitive slots only accept non-object overrides.
 * - An array override replaces the whole array.
 * - A shape without fields clones a record override as is (open object).
 */
function createPayloadShape(
  shape: Shape,
  override: unknown,
  registerOwned?: RegisterOwned
): Record<string, unknown> {
  const keys = Object.keys(shape);
  if (keys.length === 0 && isRecord(override)) return structuredClone(override);

  const overrideRecord =
    typeof override === "object" && override !== null
      ? (override as Record<string, unknown>)
      : undefined;
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    const descriptor = shape[key];
    const itemOverride = overrideRecord?.[key];
    if (isVariantDescriptor(descriptor)) {
      throw new Error("A payload shape cannot contain a variant.");
    } else if (isNestedDescriptor(descriptor)) {
      result[key] = createPayloadShape(descriptor.definition.shape, itemOverride, registerOwned);
    } else if (isRecordsDescriptor(descriptor)) {
      throw new Error("A payload shape cannot contain records.");
    } else if (isCustomDescriptor(descriptor)) {
      result[key] = descriptor.create(
        isRecord(itemOverride) ? itemOverride : undefined,
        registerOwned
      );
    } else if (isRelationDescriptor(descriptor) && descriptor.creates) {
      result[key] = createOwned(descriptor, itemOverride, registerOwned);
    } else {
      result[key] = clonePayloadValue(
        resolveDefault((descriptor as ValueDescriptor | RelationDescriptor).default),
        itemOverride
      );
    }
  }
  return result;
}

function clonePayloadValue(value: unknown, override?: unknown): unknown {
  if (Array.isArray(value)) {
    return (override && Array.isArray(override) ? override : value).map((item) =>
      clonePayloadValue(item)
    );
  }

  if (typeof value === "object" && value !== null) {
    if (Object.keys(value).length === 0 && isRecord(override)) return structuredClone(override);
    const overrideRecord =
      override && typeof override === "object" ? (override as Record<string, unknown>) : undefined;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        clonePayloadValue(item, overrideRecord?.[key])
      ])
    );
  }

  return override !== undefined && typeof override !== "object" ? override : value;
}

/** The RelationMap format can express only one discriminant per object level, so a shape can declare only one variant. */
function validateShape(shape: Shape) {
  const variants = Object.keys(shape).filter((key) => isVariantDescriptor(shape[key]));
  if (variants.length > 1) {
    throw new Error(`A shape can declare only one variant: ${variants.join(", ")}`);
  }
}

function buildDefinition<S extends Shape>(shape: S): Definition<S> {
  validateShape(shape);
  const variantKey = Object.keys(shape).find((key) => isVariantDescriptor(shape[key])) ?? null;
  let relations: RelationTree | undefined;
  let properties: PropertyEntry[] | undefined;

  /** `create(overrides?, registerOwned?)` or `create(discriminant, overrides?, registerOwned?)` */
  function create(...args: unknown[]) {
    if (variantKey !== null && typeof args[0] === "string") {
      const [value, overrides, registerOwned] = args as [string, unknown, RegisterOwned?];
      return createFromShape(
        shape,
        { ...(isRecord(overrides) ? overrides : {}), [variantKey]: value },
        registerOwned
      );
    }
    const [overrides, registerOwned] = args as [unknown, RegisterOwned?];
    return createFromShape(shape, isRecord(overrides) ? overrides : undefined, registerOwned);
  }

  const definition = {
    [DEFINITION]: true,
    shape,
    create,
    get relations() {
      return (relations ??= buildRelationTree(shape));
    },
    get properties() {
      return (properties ??= collectProperties(shape));
    }
  };
  return definition as unknown as Definition<S>;
}

/** Defines non-record ProjectData structures (Position, Coord, Transition, ...). */
export function defineData<const S extends Shape>(shape: S): Definition<S> {
  return buildDefinition<S>(shape);
}

/** Defines a project record (a record map value of `Types.Data`). */
export function defineProjectData<K extends RecordKey, const S extends Shape>(
  recordKey: K,
  shape: S
): ProjectDataDefinition<K, S> {
  const idKey =
    Object.keys(shape).find((key) => {
      const descriptor = shape[key];
      return isValueDescriptor(descriptor) && descriptor.isId;
    }) ?? null;

  const definition = Object.defineProperties(buildDefinition<S>(shape), {
    recordKey: { value: recordKey, enumerable: true },
    idKey: { value: idKey, enumerable: true }
  }) as ProjectDataDefinition<K, S>;

  projectDefinitions.set(recordKey, definition as unknown as ErasedProjectDataDefinition);
  return definition;
}
