/**
 * Barrel exports for the cache-aware Axios helpers.
 *
 * Public surface:
 * - `cachedAxios`: shared ACI-wrapped Axios instance.
 * - `withQuery`, `withMutation`: low-level cache helpers.
 * - `makeCacheHelpers`: pre-bound helpers with a base config.
 * - `buildConfig`, `ConfigInputSchema`: key/tag builder utilities.
 * - `orvalMutator`: Orval-compatible mutator.
 * - Re-exported types from Axios and ACI for convenience.
 */

export { withMutation, withQuery } from './cache';
export { cachedAxios } from './cachedAxios';
export type { BuiltNode, ConfigInput, Id, SegInput, Shape, Tag, WithFns } from './config';
export { buildConfig, ConfigInputSchema } from './config';
export { type BaseInput, makeCacheHelpers } from './factory';
export {  type OrvalBodyType,
  type OrvalErrorType,
  orvalMutator,
} from './mutator';
// Re-export axios types for generated code compatibility
export type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Re-export ACI types used in our local augmentations
export type {
  CacheProperties,
  CacheRequestConfig,
} from 'axios-cache-interceptor';
