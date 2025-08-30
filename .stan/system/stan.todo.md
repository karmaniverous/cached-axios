# Development Plan (stan.todo.md)

When updated: 2025-08-30T14:10:00Z

## Next up
- Run `npm run diagrams` and confirm `diagrams/out/hello-world.png`
  renders (pinned to v18.0).
- When upgrading PlantUML locally, re-test awslabs v19/v20 and consider
  unpinning.
- Build/test/typecheck to validate new subpath outputs:
  - `npm run build` (verify dist/mjs|cjs/mutators/* and dist/mutators/*.d.ts)
  - `npm run test`, `npm run typecheck`, `npm run lint`
  - Confirm ESLint is clean after export sort and template simplification.

## Completed (recent)
- Add stable mutator subpath exports:
  - Created `src/mutators/orval.ts` and `src/mutators/index.ts`.
  - Switched Rollup to multi-entry for JS + DTS outputs.
  - Extended `package.json` exports with `./mutators` and
    `./mutators/orval`; updated README guidance.
- Fixed ESLint issues:
  - Simplified unnecessary template literal in `rollup.config.ts`.
  - Combined and sorted re-exports in `src/mutators/*` to satisfy simple-import-sort.
- Fixed ESLint export sort error in `src/index.ts` and cleaned minor
  formatting artifacts in `src/cache.ts` and `src/config.ts`.
- Created `./.stan/system/stan.project.md` to memorialize repo-specific  requirements (caching semantics, config builder behavior, bundling,
  API surface).- Added informative TypeDoc comments to all functions and key exports
  across `src/` (cache/config/factory/cachedAxios/mutator/index).
- Replaced template README with library documentation and examples
  (quick start, builders, helpers, Orval integration, API surface).
- Simplified project tsconfig (removed composite, declaration\*, outDir,
  tsBuildInfoFile) to avoid Rollup/TS plugin validation while keeping
  typecheck-only noEmit; bundling continues to use tsconfig.rollup.json.
- Extracted shared TS config to `tsconfig.base.json` and updated both
  `tsconfig.json` and `tsconfig.rollup.json` to extend it.
