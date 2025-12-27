# STAN Assistant Guide — @karmaniverous/cached-axios

This guide explains how to use `@karmaniverous/cached-axios` correctly without needing to read internal `.d.ts` files or generated TypeDoc pages.

## What this package is

This package provides cache-aware Axios helpers on top of **axios-cache-interceptor (ACI)**:

- A shared ACI-wrapped Axios instance (`cachedAxios`).
- A small tag index to support “tag-based invalidation” within a single running process.
- Helpers to:
  - perform query-like requests with stable cache IDs and tag registration (`withQuery`)
  - perform mutation-like requests that invalidate tagged cached entries (`withMutation`)
  - pre-bind base Axios config into helpers (`makeCacheHelpers`)
  - generate consistent IDs/tags from a declarative shape (`buildConfig`)
  - integrate with Orval via a mutator (`orvalMutator`)

Target runtime: Node.js 20+.

## Mental model (how caching and invalidation works here)

Define two kinds of keys:

- **Id**: a stable cache key for a specific resource representation (example: `user:byId:42`).
- **Tag**: a coarse grouping key used to invalidate multiple IDs together (example: `user:list`).

Runtime behavior:

- `withQuery(call, id, tags, base?)`
  - forces ACI to use your provided `id` as the cache key for that request
  - remembers the association `tag -> id` in an in-memory index for later invalidation
- `withMutation(call, invalidateTags, base?)`
  - collects all IDs currently registered under the provided tags
  - forwards an ACI `update` map of `{ [id]: 'delete' }` to delete those cached entries
  - clears those tag buckets from the in-memory index after the call

Important scope constraint:

- The tag index is **process-local** and **in-memory only**.
- It is not persisted, not shared between Node processes, and not shared across machines/containers.
- Tag invalidation only affects IDs that were previously registered via `withQuery` in the same process lifetime.

## Public entrypoints you should use

From the package root:

```ts
import {
  cachedAxios,
  withQuery,
  withMutation,
  makeCacheHelpers,
  buildConfig,
  orvalMutator,
} from '@karmaniverous/cached-axios';
```

Recommended generator-facing subpaths:

```ts
import { orvalMutator } from '@karmaniverous/cached-axios/mutators/orval';
// or, for manual imports:
import { orvalMutator } from '@karmaniverous/cached-axios/mutators';
```

## Minimum working patterns

### 1) Build stable IDs and tags with `buildConfig`

Use `buildConfig` to create a consistent keyspace without hand-concatenating strings.

```ts
import { buildConfig } from '@karmaniverous/cached-axios';

const cfg = buildConfig({
  user: {
    byId: undefined,
    list: undefined,
  },
});

const id = cfg.user.byId.id(42); // "user:byId:42"
const tag = cfg.user.list.tag(); // "user:list"
```

Segments:

- Each node has `id(seg?)` and `tag(seg?)`.
- `seg` can be `string | number | (string|number)[] | undefined`.
- Parts are joined with `:` with no escaping.

Practical guidance:

- Treat `:` as reserved; do not place `:` inside segment values unless you deliberately want that structure.

### 2) Query-like call with stable ID + tag registration (`withQuery`)

```ts
import { cachedAxios, withQuery } from '@karmaniverous/cached-axios';

const res = await withQuery<User>(
  cachedAxios.request,
  'user:byId:42',
  ['user:list'],
  {
    url: '/users/42',
    method: 'get',
    baseURL: 'https://api.example.com',
  },
);
```

What to remember:

- `call` is usually `cachedAxios.request`, but can be any `(opts) => Promise<AxiosResponse>` function.
- `base` is shallow-merged into the request config used by the helper.
- The helper sets `cache.id` for ACI and then registers the ID under the provided tags.

### 3) Mutation-like call with tag invalidation (`withMutation`)

```ts
import { cachedAxios, withMutation } from '@karmaniverous/cached-axios';

const res = await withMutation(
  cachedAxios.request,
  ['user:list'], // tags to invalidate
  {
    url: '/users/42',
    method: 'patch',
    data: { name: 'Alice' },
    baseURL: 'https://api.example.com',
  },
);
```

What to remember:

- Invalidation only targets IDs currently known in the in-memory tag index.
- After the mutation call, the tag buckets passed to `withMutation` are cleared.

### 4) Pre-bind base request config with `makeCacheHelpers`

Use this when you always need the same `baseURL`, auth headers, or similar defaults.

```ts
import { cachedAxios, makeCacheHelpers } from '@karmaniverous/cached-axios';

const { query, mutation } = makeCacheHelpers(() => ({
  baseURL: 'https://api.example.com',
  headers: { Authorization: `Bearer ${process.env.TOKEN}` },
}));

await query<User>(
  cachedAxios.request,
  'user:byId:42',
  ['user:list'],
  { url: '/users/42', method: 'get' },
);

await mutation(
  cachedAxios.request,
  ['user:list'],
  { url: '/users/42', method: 'patch', data: { name: 'Bob' } },
);
```

Merging semantics (important):

- Base config and per-call options are **shallow merged**.
- If you pass `headers` in options, it replaces the entire `headers` object from base (it is not deep-merged).

## The shared instance: `cachedAxios`

`cachedAxios` is a shared Axios instance created by `axios.create()` and wrapped by ACI with defaults:

- `interpretHeader: true` (honor HTTP caching headers)
- `staleIfError: true` (serve stale on revalidation errors)
- `ttl: 5 minutes` fallback when headers do not specify caching

Design note:

- No `baseURL` is set on the shared instance. Pass `baseURL` per request (or bind it via `makeCacheHelpers`) to keep parallel calls safe across multiple backends.

## Cache config and per-request overrides

Type surface:

- `AxiosRequestConfig.cache` accepts either:
  - `false` (disable caching for that request), or
  - an object: `Partial<CacheProperties>`

How the helpers treat `base.cache`:

- If `base.cache` is an object, it is shallow-merged into the helper’s cache config.
- The helpers then set only what they need:
  - `withQuery`: sets `cache.id`
  - `withMutation`: sets `cache.update`

Current caveat (implementation detail you must account for):

- As implemented, `withQuery` and `withMutation` always pass an object-valued `cache` config to ACI.
- That means passing `cache: false` to these helpers does not behave as “disable caching” for that request.
- If you truly need `cache: false`, bypass these helpers and call `cachedAxios.request({ ..., cache: false })` directly (and accept that tag registration or tag-based invalidation will not be applied for that call).

## Orval integration

Use the provided mutator to ensure generated clients execute through the shared cache-aware Axios instance:

```ts
// orval.config.ts
export default {
  api: {
    input: './openapi.yaml',
    output: {
      client: 'axios',
      target: './src/generated/client.ts',
      mutator: {
        path: '@karmaniverous/cached-axios/mutators/orval',
        name: 'orvalMutator',
      },
    },
  },
};
```

What the mutator does:

- Shallow-merges `options` over `config` and calls `cachedAxios.request(...)`.
- Always returns `AxiosResponse<T>`.

What the mutator does not do:

- It does not automatically assign stable cache IDs (`cache.id`).
- It does not register tags or perform tag-based invalidation.

If you want tag-based invalidation with generated clients:

- Keep Orval for request typing and transport, but implement a small service layer that:
  - chooses stable IDs/tags (often via `buildConfig`)
  - calls `withQuery(cachedAxios.request, id, tags, config)` for read endpoints
  - calls `withMutation(cachedAxios.request, invalidateTags, config)` for write endpoints

## Common pitfalls

- Expecting invalidation across processes: the tag index is in-memory and process-local.
- Forgetting that invalidation only affects IDs that have been registered via `withQuery` in the current process.
- Relying on deep-merging of headers: base/options merging is shallow.
- Using unstable IDs: if IDs change across calls, you will miss caches and invalidation will be inconsistent.

## Assistant checklist (practical)

- Prefer `buildConfig` to define the keyspace once and reuse it consistently.
- Use `withQuery` for GET-like requests and `withMutation` for write-like requests.
- If you need consistent defaults (baseURL, auth), use `makeCacheHelpers`.
- For Orval, use `@karmaniverous/cached-axios/mutators/orval` as the mutator path, and keep tagging/invalidation in a service layer above the generated client.
