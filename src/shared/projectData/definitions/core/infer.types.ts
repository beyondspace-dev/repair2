import type { Prettify } from "../../../utils.types";
import type { RegisterOwned } from "../../factories/factory";
import type {
  AnyDataDefinition,
  CustomDescriptor,
  DataDefinition,
  GroupDescriptor,
  NestedDescriptor,
  RelationDescriptor,
  Shape,
  ValueDescriptor,
  VariantCases,
  VariantDescriptor
} from "./descriptor";

export type ShapeOf<D> = D extends DataDefinition<infer S> ? S : never;

type Join<Prefix extends string, Key extends string> = Prefix extends "" ? Key : `${Prefix}.${Key}`;

/** `{ name, shape }` union with groups flattened */
export type CaseEntries<C, Prefix extends string = ""> = {
  [K in keyof C & string]: C[K] extends GroupDescriptor<infer G extends VariantCases>
    ? CaseEntries<G, Join<Prefix, K>>
    : { name: Join<Prefix, K>; shape: C[K] };
}[keyof C & string];

export type CaseName<C> = CaseEntries<C>["name"];

type CaseShape<C, Name> =
  Extract<CaseEntries<C>, { name: Name }> extends { shape: infer CS } ? CS : never;

type VariantKeyOf<S> = {
  [K in keyof S]: S[K] extends VariantDescriptor<any, any, any, any> ? K : never;
}[keyof S];

export type InferDescriptor<D> =
  D extends ValueDescriptor<infer T, boolean>
    ? T
    : D extends NestedDescriptor<infer ND>
      ? InferData<ND>
      : D extends RelationDescriptor<any, any, any, infer T, any>
        ? T
        : D extends CustomDescriptor<infer T>
          ? T
          : never;

type CommonPart<S> = {
  -readonly [K in Exclude<keyof S, VariantKeyOf<S>>]: InferDescriptor<S[K]>;
};

type Distribute<A, M> = M extends unknown ? Prettify<A & M> : never;

type VariantMembers<K extends PropertyKey, V> =
  V extends VariantDescriptor<infer C, infer P, infer Open, any>
    ? P extends string
      ? | (CaseEntries<C> extends infer E
            ? E extends { name: infer N; shape: infer CS }
              ? { [k in K]: N } & {
                  [p in P]: CS extends Shape ? PayloadShape<CS> : string | number | null;
                }
              : never
            : never)
        | ({ [k in K]: "" } & { [p in P]: null })
      : | (CaseEntries<C> extends infer E
            ? E extends { name: infer N; shape: infer CS extends Shape }
              ? { [k in K]: N } & InferShape<CS>
              : never
            : never)
        | (Open extends Shape ? { [k in K]: string } & InferShape<Open> : never)
    : never;

/** A payload shape without fields is an open object that clones any value. Inferred as unknown, like the legacy types. */
type PayloadShape<S extends Shape> = [keyof S] extends [never] ? unknown : InferShape<S>;

export type InferShape<S extends Shape> = [VariantKeyOf<S>] extends [never]
  ? Prettify<CommonPart<S>>
  : Distribute<CommonPart<S>, VariantMembers<VariantKeyOf<S>, S[VariantKeyOf<S>]>>;

/** TypeScript type of the data created by a definition */
export type InferData<D> = D extends DataDefinition<infer S> ? InferShape<S> : never;

type OwnRequirement<D> =
  D extends RelationDescriptor<any, "one", "own", any, true>
    ? string
    : D extends NestedDescriptor<infer ND>
      ? keyof OwnRequirements<ShapeOf<ND>> extends never
        ? never
        : OwnRequirements<ShapeOf<ND>>
      : never;

/** Owned relations that must be overridden when creating without registerOwned (excluding variants) */
export type OwnRequirements<S extends Shape> = {
  [K in keyof S as OwnRequirement<S[K]> extends never ? never : K]-?: OwnRequirement<S[K]>;
};

/**
 * Overrides for the fields other than the variant. Nested values are partial recursively.
 * When `Strict` (no registerOwned), owned relation overrides are required.
 */
type PlainOverrides<S extends Shape, Strict extends boolean> = {
  [K in Exclude<keyof S, VariantKeyOf<S>>]?: S[K] extends NestedDescriptor<infer ND>
    ? Overrides<ShapeOf<ND>, Strict>
    : InferDescriptor<S[K]>;
} & (Strict extends true ? OwnRequirements<S> : unknown);

/** Case shape for discriminant N. undefined for the empty discriminant ("") or an unknown value */
type SelectCase<C, Open, N> =
  N extends CaseName<C> ? CaseShape<C, N> : Open extends Shape ? Open : undefined;

/** Payload override. A case without fields is an open object that accepts any value. */
type PayloadOverride<CS extends Shape> = [keyof CS] extends [never]
  ? unknown
  : Partial<InferShape<CS>> | null;

/** Override of the variant part for case N, excluding the discriminant field */
type CaseOverrides<V, N, Strict extends boolean> =
  V extends VariantDescriptor<infer C, infer P, infer Open, any>
    ? SelectCase<C, Open, N> extends infer CS
      ? P extends string
        ? CS extends Shape
          ? { [p in P]?: PayloadOverride<CS> } & (Strict extends true
              ? keyof OwnRequirements<CS> extends never
                ? unknown
                : { [p in P]: OwnRequirements<CS> }
              : unknown)
          : { [p in P]?: CS extends null ? string | number | null : null }
        : CS extends Shape
          ? Overrides<CS, Strict>
          : unknown
      : never
    : never;

/** Override of a variant whose discriminant is inside the overrides (create without a discriminant argument, nested variants) */
type VariantUnionOverrides<K extends PropertyKey, V, Strict extends boolean> =
  V extends VariantDescriptor<infer C, infer P, infer Open, infer D>
    ? | (CaseName<C> extends infer N
          ? N extends string
            ? { [k in K]: N } & CaseOverrides<V, N, Strict>
            : never
          : never)
      | ({ [k in K]?: undefined } & CaseOverrides<V, D, Strict>)
      | (P extends string ? { [k in K]: "" } & CaseOverrides<V, "", Strict> : never)
      | (Open extends Shape ? { [k in K]: string } & CaseOverrides<V, string, Strict> : never)
    : never;

type Overrides<S extends Shape, Strict extends boolean> = [VariantKeyOf<S>] extends [never]
  ? PlainOverrides<S, Strict>
  : PlainOverrides<S, Strict> & VariantUnionOverrides<VariantKeyOf<S>, S[VariantKeyOf<S>], Strict>;

/** Overrides of create() (when registerOwned is passed) */
export type CreateOverrides<S extends Shape> = Overrides<S, false>;

type TopVariant<S> = S[VariantKeyOf<S> & keyof S];

/** Values accepted as the discriminant */
type CaseNames<S> =
  TopVariant<S> extends VariantDescriptor<infer C, infer P, infer Open, any>
    ? CaseName<C> | (P extends string ? "" : never) | (Open extends Shape ? string : never)
    : never;

type CaseCreateOverrides<S extends Shape, N, Strict extends boolean> = PlainOverrides<S, Strict> &
  CaseOverrides<TopVariant<S>, N, Strict>;

/** Data type created with discriminant N */
type CaseData<S extends Shape, N> =
  TopVariant<S> extends VariantDescriptor<infer C, infer P, infer Open, any>
    ? SelectCase<C, Open, N> extends infer CS
      ? P extends string
        ? Prettify<
            CommonPart<S> & { [k in VariantKeyOf<S>]: N } & {
              [p in P]: CS extends Shape
                ? PayloadShape<CS>
                : CS extends null
                  ? string | number | null
                  : null;
            }
          >
        : Distribute<
            CommonPart<S>,
            { [k in VariantKeyOf<S>]: N } & (CS extends Shape ? InferShape<CS> : unknown)
          >
      : never
    : never;

type DefaultCreateFn<S extends Shape> = {
  (
    overrides: (Overrides<S, false> & object) | undefined,
    registerOwned: RegisterOwned
  ): InferShape<S>;
} & ({} extends Overrides<S, true>
  ? { (overrides?: Overrides<S, true> & object): InferShape<S> }
  : { (overrides: Overrides<S, true> & object): InferShape<S> });

type VariantCreateFn<S extends Shape> = {
  <N extends CaseNames<S>>(
    value: N,
    overrides: CaseCreateOverrides<S, N, false> | undefined,
    registerOwned: RegisterOwned
  ): CaseData<S, N>;
  <N extends CaseNames<S>>(
    value: N,
    ...rest: {} extends CaseCreateOverrides<S, N, true>
      ? [overrides?: CaseCreateOverrides<S, N, true>]
      : [overrides: CaseCreateOverrides<S, N, true>]
  ): CaseData<S, N>;
};

/**
 * - `create(overrides?, registerOwned?)`: the discriminant is taken from the overrides. The result is the full union.
 * - `create(discriminant, overrides?, registerOwned?)`: the result is narrowed to that case and the overrides are checked against it.
 * Without registerOwned, owned relation overrides are required.
 */
export type CreateFn<S extends Shape> = [VariantKeyOf<S>] extends [never]
  ? DefaultCreateFn<S>
  : DefaultCreateFn<S> & VariantCreateFn<S>;

type MutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type DefinitionMismatch<Actual, Expected> = {
  missing: Exclude<keyof Expected, keyof Actual>;
  extra: Exclude<keyof Actual, keyof Expected>;
  mismatched: {
    [K in keyof Actual & keyof Expected]: MutuallyAssignable<Actual[K], Expected[K]> extends true
      ? never
      : K;
  }[keyof Actual & keyof Expected];
};

/**
 * Enforces that a definition matches the existing TypeScript type during the migration.
 * On a mismatch, the shape argument requires a `definitionMismatch` property, which fails compilation at the call site.
 */
export type ShapeCheck<S extends Shape, Expected> = [Expected] extends [never]
  ? unknown
  : MutuallyAssignable<InferShape<S>, Expected> extends true
    ? unknown
    : { definitionMismatch: DefinitionMismatch<InferShape<S>, Expected> };

export type { AnyDataDefinition };
