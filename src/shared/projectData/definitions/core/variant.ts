import {
  DESCRIPTOR,
  isGroupDescriptor,
  isVariantDescriptor,
  type CustomDescriptor,
  type GroupDescriptor,
  type Shape,
  type VariantCase,
  type VariantCases,
  type VariantDescriptor,
  type RegisterOwned
} from "./descriptor";
import type { CaseName } from "./infer.types";

/** Builds a discriminant hierarchy. e.g. `Component: group({ create: {...} })` → `"Component.create"` */
export function group<const C extends VariantCases>(cases: C): GroupDescriptor<C> {
  return { [DESCRIPTOR]: "group", cases };
}

type PayloadVariantOptions<P extends string, D extends string> = {
  payload: P;
  /** Default discriminant. `""` is the empty case whose payload is null. */
  default: D;
};

type FlatVariantOptions<C extends VariantCases, D extends string> = {
  payload?: undefined;
  default: D;
  /** Case used for an unknown discriminant */
  fallback?: CaseName<C>;
};

type OpenVariantOptions<Open extends Shape, D extends string> = {
  payload?: undefined;
  default: D;
  /** Shape used for an unknown discriminant. The discriminant type becomes an open string. */
  open: Open;
};

export function variant<
  const C extends VariantCases,
  const P extends string,
  const D extends CaseName<C> | ""
>(cases: C, opt: PayloadVariantOptions<P, D>): VariantDescriptor<C, P, null, D>;
export function variant<
  const C extends VariantCases,
  const Open extends Shape,
  const D extends string
>(cases: C, opt: OpenVariantOptions<Open, D>): VariantDescriptor<C, null, Open, D>;
export function variant<const C extends VariantCases, const D extends CaseName<C>>(
  cases: C,
  opt: FlatVariantOptions<C, D>
): VariantDescriptor<C, null, null, D>;
export function variant(
  cases: VariantCases,
  opt: { payload?: string; default: string; fallback?: string; open?: Shape | null }
): VariantDescriptor {
  const descriptor: VariantDescriptor = {
    [DESCRIPTOR]: "variant",
    cases,
    payloadKey: opt.payload ?? null,
    default: opt.default,
    fallback: opt.fallback ?? null,
    open: opt.open ?? null
  };
  validateVariant(descriptor);
  return descriptor;
}

function validateVariant(descriptor: VariantDescriptor) {
  for (const [name, item] of listVariantCases(descriptor.cases)) {
    if (descriptor.payloadKey === null && item === null) {
      throw new Error(`Flat variant case "${name}" must be a shape.`);
    }
    if (descriptor.payloadKey !== null && item) {
      for (const key in item) {
        if (isVariantDescriptor(item[key])) {
          throw new Error(`Payload variant case "${name}" cannot contain a nested variant.`);
        }
      }
    }
  }
  if (
    descriptor.fallback !== null &&
    lookupVariantCase(descriptor, descriptor.fallback) === undefined
  ) {
    throw new Error(`Variant fallback "${descriptor.fallback}" is not a case.`);
  }
}

/** Flattens groups and returns `[discriminant, case]` entries in declaration order. */
export function listVariantCases(
  cases: VariantCases,
  prefix = ""
): [name: string, item: Shape | null][] {
  const result: [string, Shape | null][] = [];
  for (const key in cases) {
    const name = prefix ? `${prefix}.${key}` : key;
    const item = cases[key];
    if (isGroupDescriptor(item)) {
      result.push(...listVariantCases(item.cases, name));
    } else {
      result.push([name, item as Shape | null]);
    }
  }
  return result;
}

/**
 * Finds the case for a discriminant. undefined for a group itself or an unknown value.
 */
export function lookupVariantCase(
  descriptor: VariantDescriptor,
  value: unknown
): Shape | null | undefined {
  if (typeof value !== "string") return undefined;

  let current: VariantCase | undefined = undefined;
  let cases: VariantCases | null = descriptor.cases;
  for (const segment of value.split(".")) {
    if (!cases || !Object.hasOwn(cases, segment)) return undefined;
    current = cases[segment];
    cases = isGroupDescriptor(current) ? current.cases : null;
  }
  if (current === undefined || isGroupDescriptor(current)) return undefined;
  return current as Shape | null;
}

/**
 * Shape for a discriminant in flat mode. For an unknown value, the fallback case or the open shape.
 */
export function resolveFlatCase(descriptor: VariantDescriptor, value: unknown): Shape | null {
  const item = lookupVariantCase(descriptor, value);
  if (item !== undefined) return item;
  if (descriptor.fallback !== null)
    return lookupVariantCase(descriptor, descriptor.fallback) ?? null;
  return descriptor.open;
}

/** Value created by a custom create function */
export function custom<T>(
  create: (overrides: Record<string, unknown> | undefined, registerOwned?: RegisterOwned) => T
): CustomDescriptor<T> {
  return { [DESCRIPTOR]: "custom", create };
}
