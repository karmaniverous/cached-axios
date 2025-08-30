/**
 * Requirements:
 * - Provide canonical subpath entry '@karmaniverous/cached-axios/mutators/orval'
 *   that re-exports the Orval mutator for generator consumption.
 * - Keep the module lean for optimal tree-shaking.
 */
export { orvalMutator } from '../mutator';
export type { OrvalBodyType, OrvalErrorType } from '../mutator';

// Intentionally minimal: this file exists solely as a stable subpath
// entry point for generators (e.g., Orval). See package.json "exports"
// for mapping to ESM/CJS/Types outputs.
