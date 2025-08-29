import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { CacheProperties } from 'axios-cache-interceptor';

import type { Id, Tag } from './config';

/**
 * In-memory tag → ids index (tag -> set of cache IDs).
 * - The index is process-local and not persisted or shared.
 * - Used by {@link withQuery} to register ids and by {@link withMutation}
 *   to compute invalidation maps and clear buckets.
 */
const tagIndex = new Map<Tag, Set<Id>>();

/**
 * Associate a cache id with one or more tags in the in-memory index.
 * @param cacheId The stable cache id used by ACI for this resource.
 * @param tags One or more tags that will later be invalidated by a mutation.
 */
const remember = (cacheId: Id, tags: Tag[]): void => {
  for (const t of tags) {
    const set = tagIndex.get(t) ?? new Set<Id>();
    set.add(cacheId);
    tagIndex.set(t, set);
  }
};

/**
 * Collect all cache ids currently associated with any of the provided tags.
 * Note: If the same id is registered under multiple tags, it may appear
 * multiple times in the returned array. Downstream consumers (e.g., an
 * update map) naturally de-duplicate by key.
 * @param tags Tags to query.
 * @returns Array of cache ids registered under any tag.
 */
const idsFor = (tags: Tag[]): Id[] => {
  const out: Id[] = [];
  for (const t of tags) {
    const set = tagIndex.get(t);
    if (!set) continue;
    for (const id of set) out.push(id);
  }
  return out;
};

/**
 * Extract a forwarded Partial<CacheProperties> from a base Axios config.
 * - If `base.cache` is `false`, returns `undefined` (caching disabled).
 * - If object, returns it for shallow merging by helpers.
 */
const inheritCache = (
  base?: AxiosRequestConfig,
): Partial<CacheProperties> | undefined => {
  const c = base?.cache;
  return c && typeof c === 'object' ? c : undefined;
};

/**
 * Build an ACI `update` map that deletes ids associated with the given tags.
 * @param tags Tags whose registered ids should be invalidated.
 * @returns Record mapping cache id -> 'delete'.
 */
const updateMapFor = (tags: Tag[]): Record<string, 'delete'> => {
  const update: Record<string, 'delete'> = {};
  for (const id of idsFor(tags)) update[id] = 'delete';
  return update;
};

/**
 * Execute a GET-like call with a stable cache id and tag registration.
 * - Merges any object-valued `base.cache` into the helper's cache config.
 * - Registers the cache id under the provided tags for future invalidation.
 * - Leaves response shape intact; caller validates payload type.
 *
 * @typeParam T Expected response data type.
 * @param call Function that performs the request (e.g., `cachedAxios.request`).
 * @param id Stable cache id to use for this resource.
 * @param tags Tags to associate with `id` for future invalidation.
 * @param base Optional Axios config; shallow-merged into the final request.
 * @returns The AxiosResponse with data typed as T.
 */
export const withQuery = async <T>(
  call: (opts: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
  id: Id,
  tags: Tag[],
  base?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {  const cacheCfg: Partial<CacheProperties> = {
    ...(inheritCache(base) ?? {}),
    id,
  };

  const res = await call({
    ...(base ?? {}),
    cache: cacheCfg,
  });

  remember(id, tags);
  return res as AxiosResponse<T>;
};

/**
 * Execute a write-like call with tag-based invalidation.
 * - Builds an `update` map that tells ACI to delete affected ids.
 * - Clears tag buckets in the in-memory index after the call.
 * - Leaves response shape intact; caller validates payload type.
 *
 * @typeParam T Expected response data type.
 * @param call Function that performs the request (e.g., `cachedAxios.request`).
 * @param invalidate Tags whose registered ids should be invalidated.
 * @param base Optional Axios config; shallow-merged into the final request.
 * @returns The AxiosResponse with data typed as T.
 */
export const withMutation = async <T>(
  call: (opts: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
  invalidate: Tag[],
  base?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {  const cacheCfg: Partial<CacheProperties> = {
    ...(inheritCache(base) ?? {}),
    update: updateMapFor(invalidate),
  };

  const res = await call({
    ...(base ?? {}),
    cache: cacheCfg,
  });

  // clear tag buckets (ids will be gone from storage)
  for (const t of invalidate) tagIndex.delete(t);
  return res as AxiosResponse<T>;
};

/**
 * Debug/testing surface.
 * - `tagIndex`: the in-memory tag → ids map.
 * - `idsFor(tags)`: helper used by invalidation logic.
 */
export const _debug = {
  tagIndex,
  idsFor,
};