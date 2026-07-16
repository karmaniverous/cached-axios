# Project Prompt (stan.project.md) — @karmaniverous/cached-axios

Purpose

- Provide a small, focused toolkit to build cache-aware Axios services
  on top of axios-cache-interceptor (ACI).
- Offer simple, tag-based invalidation and ergonomic helpers that work
  well with generated clients (e.g., Orval) and hand-written services.

Target environment

- Node.js 20+ (see package.json engines).
- Bundled distribution targets:
  - ESM (dist/mjs), CJS (dist/cjs), and a single type bundle
    (dist/index.d.ts).
  - Runtime dependencies and Node built-ins are external.

Bundling and TypeScript

- Rollup configuration:
  - Minimal plugin set: @rollup/plugin-typescript and
    rollup-plugin-dts.
  - All runtime dependencies and peer dependencies are treated as
    external (including “deep” subpaths).
  - Outputs:
    - dist/mjs/_ (ESM), dist/cjs/_ (CJS), dist/index.d.ts.
- TypeScript configuration:
  - Shared options in tsconfig.base.json.
  - Project tsconfig.json is typecheck-only (noEmit: true) and avoids
    composite/outDir/declaration settings to prevent conflicts with
    bundling.
  - tsconfig.rollup.json is used only during bundling; it enables emit
    and disables declarations (DTS is produced by rollup-plugin-dts).

Caching semantics and helpers

- A shared Axios instance is created and wrapped by ACI:
  - interpretHeader: true (honor HTTP caching headers),
  - staleIfError: true,
  - ttl: 5 minutes (when headers do not specify).
- Cache identity and invalidation:
  - withQuery(call, id, tags, base?): Performs a GET-like request with
    a stable custom cache id (id) and registers it under provided tags
    (tags) for future invalidation.
  - withMutation(call, invalidate, base?): Performs a write-like
    request and forwards an update map (`{[id]: 'delete'}`) for every
    id currently associated with any tag in `invalidate`. After the
    request, it clears the in-memory tag buckets for those tags.
  - Tag index is held in an in-memory Map<Tag, Set<Id>> and is local to
    the current process; it is not persisted or shared across
    processes/instances.
  - ACI-specific request configuration is forwarded/merged from
    `base.cache` when present; callers can pass `cache: false` to
    disable caching per request.
- Ergonomics:
  - makeCacheHelpers(base?): Returns `{ query, mutation }` helpers that
    pre-merge a “base” AxiosRequestConfig (object or factory).
  - buildConfig(shape): Accepts a nested object shape with `undefined`
    leaves and returns a structurally identical object where every node
    exposes:
    - `id(seg?)` and `tag(seg?)` that build colon-delimited keys based
      on the path to that node plus optional segment(s).
    - `seg` may be `string | number | (string|number)[] | undefined`.
    - Keys are always strings; segments are joined with `:`.

Orval integration

- orvalMutator<T, R>(config, options?): Orval-compatible mutator that
  executes through the cached Axios instance and always resolves to
  `AxiosResponse<T>`. Suitable for use as the `mutator` in Orval
  configuration. Keeps cache-aware semantics via the same ACI instance.

Public API

- Exports:
  - `cachedAxios` — a shared Axios instance wrapped by
    axios-cache-interceptor.
  - `withQuery`, `withMutation` — low-level cache helpers.
  - `makeCacheHelpers` — returns `{ query, mutation }` bound to a base
    config.
  - `buildConfig`, `ConfigInputSchema` — config builder and validation.
  - `orvalMutator`, `OrvalBodyType`, `OrvalErrorType` — Orval adapter.
  - Types re-exported for downstream convenience:
    `AxiosError`, `AxiosRequestConfig`, `AxiosResponse`,
    `CacheProperties`, `CacheRequestConfig`, `BuiltNode`, `ConfigInput`,
    `Id`, `Tag`.
  - Subpath exports (mutators):
    - `@karmaniverous/cached-axios/mutators/orval` — canonical path for
      code generators (preferred; best tree-shaking).
    - `@karmaniverous/cached-axios/mutators` — convenience barrel for
      manual imports (re-exports named mutators).
    - The root entry continues to export `orvalMutator` for manual use,
      but generator configs should target the precise subpath above.
- Type augmentations (src/types.d.ts):
  - Adds an optional `cache?: false | Partial<CacheProperties>` to
    `AxiosRequestConfig`.
  - Adds `cached?: boolean` and `previous?: AxiosResponse` to
    `AxiosResponse`.
  - Extends ACI’s `CacheProperties` with optional `id`, `etag`, and
    `update: Record<string, 'delete'>`.

Testing, linting, docs

- Unit tests with Vitest; coverage is generated automatically.
- ESLint and Prettier configured with flat config and strict TypeScript
  rules; import sorting enforced.
- TypeDoc generates API docs and consumes the README; `typedoc-plugin-
replace-text` may hide README sections bracketed by
  `<!-- TYPEDOC_EXCLUDE --> ... <!-- /TYPEDOC_EXCLUDE -->`.

Behavioral requirements and notes

- The helpers must:
  - Keep external request/response types intact (always surface
    `AxiosResponse<T>`).
  - Merge `base` and `options` shallowly with `options` taking
    precedence.
  - Propagate existing `base.cache` object (if any) and override only
    helper-specific fields (`id`, `update`).
  - Treat Node built-ins and runtime dependencies as Rollup externals.
- Scope/caveats:
  - Tag index is intentionally in-memory. For multi-process or
    distributed invalidation, push invalidation to the server or a
    shared cache layer (e.g., Redis) and wire it through ACI.

Versioning and release

- Release workflow:
  - release-it publishes to GitHub and NPM; changelog managed by
    auto-changelog.
  - Only the `dist/` folder is shipped.

## STAN assistant guide — creation & upkeep policy

This repository SHOULD include a “STAN assistant guide” document at `guides/stan-assistant-guide.md` (or an equivalent single, stable path if your repo uses a different docs layout). This guide exists to let STAN assistants use and integrate the library effectively without consulting external type definition files or other project documentation.

Policy

- Creation (required):
  - If `guides/stan-assistant-guide.md` is missing, create it as part of the first change set where you would otherwise rely on it (e.g., when adding/altering public APIs, adapters, configuration, or key workflows).
  - Prefer creating it in the same turn as the first relevant code changes so it cannot drift from reality.
- Maintenance (required):
  - Treat the guide as a maintained artifact, not a one-off doc.
  - Whenever a change set materially affects how an assistant should use the library (public exports, configuration shape/semantics, runtime invariants, query contracts, paging tokens, projection behavior, adapter responsibilities, or common pitfalls), update the guide in the same change set.
  - When deprecating/renaming APIs or changing semantics, update the guide and include migration guidance (old → new), but keep it concise.
- Intent (what the guide must enable):
  - Provide a self-contained description of the “mental model” (runtime behavior and invariants) and the minimum working patterns (how to configure, how to call core entrypoints, how to integrate a provider/adapter).
  - Include only the information required to use the library correctly; omit narrative or historical context.
- Constraints (how to keep it effective and reusable):
  - Keep it compact: “as short as possible, but as long as necessary.”
  - Make it self-contained: do not require readers to import or open `.d.ts` files, TypeDoc pages, or other repo docs to understand core contracts.
  - Avoid duplicating durable requirements or the dev plan:
    - Requirements belong in `stan.requirements.md`.
    - Work tracking belongs in `stan.todo.md`.
    - The assistant guide should focus on usage contracts and integration.
  - Define any acronyms locally on first use within the guide (especially if used outside generic type parameters).
