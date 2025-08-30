import { z } from 'zod';

/**
 * Branded cache key types produced by {@link buildConfig}.
 * - `Id` is used for cache keys (stable, resource-specific).
 * - `Tag` groups cache ids for invalidation (coarse-grained).
 */
export type Id = string & { readonly __brand: 'Id' };
export type Tag = string & { readonly __brand: 'Tag' };

/**
 * Input config schema for {@link buildConfig}.
 * - Nested objects; leaves are `undefined`.
 * - The resulting structure mirrors the input and adds `id()`/`tag()` at every node.
 */
export const ConfigInputSchema: z.ZodType<Record<string, unknown>> = z.lazy(
  () => z.record(z.string(), z.union([z.undefined(), ConfigInputSchema])),
);

export type ConfigInput = z.output<typeof ConfigInputSchema>;
/** Segment types accepted by id/tag */
export type Segment = string | number;
export type SegInput = Segment | Segment[] | undefined;

/** Methods at every node */export type WithFns = {
  id: (seg?: SegInput) => Id;  tag: (seg?: SegInput) => Tag;
};

type Leaf = undefined;
export type Shape = { readonly [k: string]: Shape | Leaf };

export type BuiltNode<T, P extends string[]> = WithFns &
  (T extends undefined    ? {}
    : { readonly [K in keyof T]: BuiltNode<T[K], [...P, Extract<K, string>]> });

/**
 * Normalize a segment or segments into an array of string parts.
 * - `undefined` → [], single value → [value], array → mapped array.
 */
const toSegs = (seg?: SegInput): string[] =>
  seg === undefined
    ? []
    : Array.isArray(seg)
      ? seg.map((s) => String(s))
      : [String(seg)];

/** Join path parts into a colon-delimited key. */
const join = (parts: Array<string | number>): string =>
  parts.map(String).join(':');

/**
 * Build a node at `path` by cloning the input shape and attaching `id()` and `tag()`.
 * - Recurses on object-valued children; leaves remain `undefined`.
 * - `id(seg?)` and `tag(seg?)` append optional segments to the current path.
 */
const buildAt = (node: unknown, path: string[]): unknown => {
  const out: Record<string, unknown> = {
    id: (seg?: SegInput) => join([...path, ...toSegs(seg)]) as Id,
    tag: (seg?: SegInput) => join([...path, ...toSegs(seg)]) as Tag,
  };
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node as Record<string, unknown>)) {
      const child = (node as Record<string, unknown>)[key];
      out[key] = buildAt(child, [...path, key]);    }
  }
  return out as unknown;
};

/**
 * Build a strongly-typed configuration object from a nested shape.
 * - Validates input with {@link ConfigInputSchema}.
 * - Every node exposes `id(seg?)` and `tag(seg?)` to generate colon-delimited keys.
 * - See tests for usage patterns.
 *
 * @typeParam T The nested shape type, e.g. `{ user: { byId: undefined } }`.
 * @param input Nested object whose leaves are `undefined`.
 * @returns A structure mirroring `input` with `id()` and `tag()` at each node.
 */
export const buildConfig = <T extends Shape>(input: T): BuiltNode<T, []> => {
  const cfg = ConfigInputSchema.parse(input) as unknown as T;
  return buildAt(cfg, []) as BuiltNode<T, []>;
};