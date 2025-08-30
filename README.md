> **_Tag‑aware caching for Axios: stable cache IDs, simple tag invalidation, and a drop‑in Orval mutator on top of axios‑cache‑interceptor._**

# @karmaniverous/cached-axios

[![npm version](https://img.shields.io/npm/v/@karmaniverous/cached-axios.svg)](https://www.npmjs.com/package/@karmaniverous/cached-axios)
![Node Current](https://img.shields.io/node/v/@karmaniverous/cached-axios) <!-- TYPEDOC_EXCLUDE -->
[![docs](https://img.shields.io/badge/docs-website-blue)](https://docs.karmanivero.us/cached-axios)
[![changelog](https://img.shields.io/badge/changelog-latest-blue.svg)](https://github.com/karmaniverous/cached-axios/tree/main/CHANGELOG.md)<!-- /TYPEDOC_EXCLUDE -->
[![license](https://img.shields.io/badge/license-BSD--3--Clause-blue.svg)](https://github.com/karmaniverous/cached-axios/tree/main/LICENSE.md)

Tag-aware caching helpers for Axios on top of
[axios-cache-interceptor](https://github.com/arthurfiorette/axios-cache-interceptor).

This library makes it easy to:

- Assign stable cache ids to GET-like requests.
- Group ids under tags and invalidate them after write-like requests.
- Share a cache-aware Axios instance across a project.
- Generate consistent id/tag keys from a declarative config shape.
- Plug into code generators such as Orval via a ready-to-use mutator.

## Installation

```bash
npm i @karmaniverous/cached-axios axios axios-cache-interceptor zod
```

Requires Node 20+.

## Quick start

```ts
import {
  cachedAxios,
  withQuery,
  withMutation,
} from '@karmaniverous/cached-axios';

// GET with a stable id; associate id with tags for later invalidation.
await withQuery<User>(
  cachedAxios.request,
  'user:42', // your stable id
  ['user:list'], // tags to register
  { url: '/users/42', method: 'get', baseURL: 'https://api.example.com' },
);

// Write and invalidate any ids under these tags.
await withMutation(
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

The helpers forward any object-valued `cache` options from your base config and
set only what they need (custom `id` for queries; `update` map for mutations).
Pass `cache: false` on a call to disable caching for that request.

## Building ids and tags with `buildConfig`

Declaratively define your keyspace, then use strongly-typed builders everywhere.

```ts
import { buildConfig } from '@karmaniverous/cached-axios';

const cfg = buildConfig({
  user: {
    byId: undefined,
    list: undefined,
  },
});

// Generate keys
const id = cfg.user.byId.id(42); // "user:byId:42"
const tag = cfg.user.list.tag(); // "user:list"
```

Segments can be `string | number | (string|number)[] | undefined`, and are joined
with `:` to form keys.

## Pre-bound helpers with `makeCacheHelpers`

```ts
import { makeCacheHelpers } from '@karmaniverous/cached-axios';

const { query, mutation } = makeCacheHelpers(() => ({
  baseURL: 'https://api.example.com',
  headers: { Authorization: 'Bearer <token>' },
}));

// Query
await query<User>(
  cachedAxios.request,
  cfg.user.byId.id(42),
  [cfg.user.list.tag()],
  {
    url: '/users/42',
    method: 'get',
  },
);

// Mutation + invalidation
await mutation(cachedAxios.request, [cfg.user.list.tag()], {
  url: '/users/42',
  method: 'patch',
  data: { name: 'Bob' },
});
```

## Orval integration

Use the provided mutator to keep generated clients cache-aware.

```ts
// orval.config.ts (or .js)
import { orvalMutator } from '@karmaniverous/cached-axios/mutators/orval';

export default {
  petstore: {
    input: './openapi.yaml',
    output: {
      target: './src/generated/client.ts',
      client: 'axios',
      mutator: {
        path: '@karmaniverous/cached-axios/mutators/orval',
        name: 'orvalMutator',
      },
    },
  },
};
```

Recommended path: '@karmaniverous/cached-axios/mutators/orval' for generators.
For manual imports, a convenience barrel is available at
'@karmaniverous/cached-axios/mutators'. The root export remains available if
you prefer: `import { orvalMutator } from '@karmaniverous/cached-axios'`.

The `orvalMutator<T, R>(config, options?)` shallow-merges `options` over `config`
and always resolves to `AxiosResponse<T>`. It executes via the same shared
cache-aware Axios instance exported as `cachedAxios`.
## The shared Axios instance (`cachedAxios`)

```ts
import { cachedAxios } from '@karmaniverous/cached-axios';
```

Defaults:

- `interpretHeader: true` — honor HTTP caching headers.
- `staleIfError: true` — serve cached data when revalidation fails.
- `ttl: 5 minutes` — fallback TTL if headers don’t specify caching.

No `baseURL` is set; pass baseURL/headers per request to keep parallel calls
safe against multiple backends.

## Caching and invalidation model

- `withQuery` sets a custom cache `id` and registers it under provided tags in
  an in-memory index.
- `withMutation` builds an ACI `update` map (`{[id]: 'delete'}`) for all ids
  currently associated with the given tags and clears those tag buckets.
- The tag index is process-local and not persisted or shared between processes.
  For distributed invalidation, prefer server-driven cache headers or a shared
  cache layer (e.g., Redis) integrated with your backend.

## API surface

- `cachedAxios`: ACI-wrapped Axios instance.
- `withQuery(call, id, tags, base?)`: GET-like helper with stable id + tag registration.
- `withMutation(call, invalidate, base?)`: write-like helper with tag-based invalidation.
- `makeCacheHelpers(base?)` → `{ query, mutation }` bound to a base config.
- `buildConfig(shape)` → nested object with `id(seg?)` and `tag(seg?)` at every node.
- `orvalMutator<T, R>(config, options?)` → AxiosResponse<T> via `cachedAxios`.
- Types:
  - Branded `Id` and `Tag`,
  - `BuiltNode`, `ConfigInput`,
  - Augmented Axios/ACI types re-exported from the package.

## Disabling caching per request

```ts
await withQuery(cachedAxios.request, 'user:42', ['user:list'], {
  url: '/users/42',
  method: 'get',
  cache: false,
});
```

## Types and augmentations

- `AxiosRequestConfig['cache']` is augmented to accept `false | Partial<CacheProperties>`.
- `AxiosResponse` exposes `cached?: boolean` and `previous?: AxiosResponse`.
- `CacheProperties` (from ACI) is extended with `id?: string`, `etag?: string`,
  and `update?: Record<string, 'delete'>`.

## Docs and support

- API docs are generated by TypeDoc (`npm run docs`).
- Tests: `npm test` (Vitest with coverage).
- Linting/formatting: `npm run lint`.

---

Built for you with ❤️ on Bali! Find more great tools & templates on [my GitHub Profile](https://github.com/karmaniverous).
