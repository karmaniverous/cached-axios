import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

/**
 * Shared Axios instance wrapped with axios-cache-interceptor (ACI).
 *
 * Defaults
 * - `interpretHeader: true` — honor HTTP cache headers.
 * - `staleIfError: true` — serve cached responses when revalidation fails.
 * - `ttl: 5 minutes` — fallback TTL if headers do not specify caching.
 *
 * Notes
 * - No `baseURL` is set; pass per-request baseURL/headers to keep helpers
 *   safe for parallel calls across multiple backends.
 */
const base = axios.create();

/** Cache-aware Axios instance used by helpers and the Orval mutator. */
export const cachedAxios = setupCache(base, {
  interpretHeader: true,
  staleIfError: true,
  ttl: 1000 * 60 * 5, // 5 minutes default if headers are missing
});

export type { AxiosCacheInstance } from 'axios-cache-interceptor';
