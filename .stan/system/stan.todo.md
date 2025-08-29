# Development Plan (stan.todo.md)

When updated: 2025-08-29T18:15:00Z

## Next up

- Run `npm run diagrams` and confirm `diagrams/out/hello-world.png`
  renders (pinned to v18.0).
- When upgrading PlantUML locally, re-test awslabs v19/v20 and consider
  unpinning.

## Completed (recent)

- Simplified project tsconfig (removed composite, declaration*, outDir,
  tsBuildInfoFile) to avoid Rollup/TS plugin validation while keeping
  typecheck-only noEmit; bundling continues to use tsconfig.rollup.json.
- Extracted shared TS config to `tsconfig.base.json` and updated both
  `tsconfig.json` and `tsconfig.rollup.json` to extend it. Rollup now
  uses its dedicated config without composite/outDir constraints, while
  the project tsconfig retains declaration/noEmit behavior.
- Resolved stan:build plugin validation by introducing a dedicated
  `tsconfig.rollup.json` without `composite`/`outDir` and pointing
  `@rollup/plugin-typescript` at it. This avoids the TS6304 and outDir
  path checks and silences sourcemap warnings while preserving TS+DTS
  minimal bundling.- Fixed stan:build failure by configuring @rollup/plugin-typescript
  with outputToFilesystem=false and compilerOptions overrides to avoid
  filesystem writes and sourcemap warnings; bundling remains TS+DTS only.
- Removed unused archive.ts and pruned tar devDependency (knip clean).
- Simplified Rollup config for library bundling: removed unused plugins
  (replace/alias/node-resolve/commonjs/json/terser), kept TS + DTS only,
  fixed ESLint warnings, and pruned unused devDependencies. This resolves
  typecheck/build/docs failures caused by @rollup/plugin-replace.
- Pinned awslabs/aws-icons-for-plantuml to v18.0 in `diagrams/aws.pu`
  to match the Chocolatey PlantUML version and ensure reliable renders.
