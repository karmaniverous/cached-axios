# Development Plan (stan.todo.md)

When updated: 2025-08-29T18:25:00Z

## Next up

- Run `npm run diagrams` and confirm `diagrams/out/hello-world.png`
  renders (pinned to v18.0).
- When upgrading PlantUML locally, re-test awslabs v19/v20 and consider
  unpinning.

## Completed (recent)

- Created `./.stan/system/stan.project.md` to memorialize repo-specific
  requirements (caching semantics, config builder behavior, bundling,
  API surface).
- Added informative TypeDoc comments to all functions and key exports
  across `src/` (cache/config/factory/cachedAxios/mutator/index).
- Replaced template README with library documentation and examples
  (quick start, builders, helpers, Orval integration, API surface).
- Simplified project tsconfig (removed composite, declaration\*, outDir,
  tsBuildInfoFile) to avoid Rollup/TS plugin validation while keeping
  typecheck-only noEmit; bundling continues to use tsconfig.rollup.json.
- Extracted shared TS config to `tsconfig.base.json` and updated both
  `tsconfig.json` and `tsconfig.rollup.json` to extend it.
