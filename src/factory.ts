import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { withMutation, withQuery } from './cache';
import type { Id, Tag } from './config';

/**
 * Base Axios configuration for helper factories.
 * - May be a static object, a factory returning a config (or undefined),
 *   or `undefined` to opt out.
 */
type BaseInput =
  | AxiosRequestConfig
  | (() => AxiosRequestConfig | undefined)
  | undefined;

/**
 * Resolve the effective base Axios config for a single invocation.
 * - If `base` is a function, it is called on each use.
 * - Shallow-merge `options` over the base (options win).
 */
const resolveBase = (
  base: BaseInput,
  options?: AxiosRequestConfig,
): AxiosRequestConfig | undefined => {
  const b = typeof base === 'function' ? base() : base;
  return { ...(b ?? {}), ...(options ?? {}) };
};

/**
 * Create pre-bound cache helpers with a base Axios config.
 * - `query(call, id, tags, options?)` delegates to {@link withQuery}.
 * - `mutation(call, invalidate, options?)` delegates to {@link withMutation}.
 * - Both helpers shallow-merge `options` over the resolved `base`.
 *
 * @param base Base Axios config or factory.
 * @returns An object with `query` and `mutation` helpers.
 */
export const makeCacheHelpers = (base?: BaseInput) => {
  const query = async <T>(
    call: (opts: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
    id: Id,
    tags: Tag[],
    options?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    return withQuery<T>(call, id, tags, resolveBase(base, options));
  };
  const mutation = async <T>(
    call: (opts: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
    invalidate: Tag[],
    options?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    return withMutation<T>(call, invalidate, resolveBase(base, options));
  };

  return { query, mutation };
};