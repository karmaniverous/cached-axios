import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import { cachedAxios } from './cachedAxios';

/** Error type alias used by Orval-generated clients. */
export type OrvalErrorType<E> = AxiosError<E>;
/** Request body type alias used by Orval-generated clients. */
export type OrvalBodyType<B> = B;

/**
 * Orval-compatible mutator that executes through the shared cache-aware instance.
 *
 * Characteristics
 * - Always returns `AxiosResponse<T>` regardless of how the generator
 *   instantiates the generic parameter.
 * - Calls through the `AxiosInstance` surface to avoid type mismatch with
 *   ACI's `CacheRequestConfig` generic parameters.
 * - Shallow-merges `options` over `config` (options win).
 *
 * @typeParam T The expected response data type.
 * @typeParam R The request body type (if any).
 * @param config Base Axios request config from generated code.
 * @param options Optional overrides to merge over `config`.
 * @returns A promise resolving to `AxiosResponse<T>`.
 */
export const orvalMutator = async <T = unknown, R = unknown>(
  config: AxiosRequestConfig<R>,
  options?: AxiosRequestConfig<R>,
): Promise<AxiosResponse<T>> => {
  const final: AxiosRequestConfig<R> = { ...config, ...(options ?? {}) };

  // Call through the base AxiosInstance signature to avoid CacheRequestConfig mismatch
  const res = await (cachedAxios as unknown as AxiosInstance).request<
    T,
    AxiosResponse<T>,
    R
  >(final);

  return res;
};