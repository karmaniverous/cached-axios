# Development Plan (stan.todo.md)

When updated: 2025-08-29T17:45:00Z

## Next up

- Run `npm run diagrams` and confirm `diagrams/out/hello-world.png`
  renders (pinned to v18.0).
- When upgrading PlantUML locally, re-test awslabs v19/v20 and consider
  unpinning.

## Completed (recent)

- Fixed stan:build failure by configuring @rollup/plugin-typescript
  with outputToFilesystem=false and compilerOptions overrides to avoid
  filesystem writes and sourcemap warnings; bundling remains TS+DTS only.
- Removed unused archive.ts and pruned tar devDependency (knip clean).
- Simplified Rollup config for library bundling: removed unused plugins
  (replace/alias/node-resolve/commonjs/json/terser), kept TS + DTS only,
  fixed ESLint warnings, and pruned unused devDependencies. This resolves
  typecheck/build/docs failures caused by @rollup/plugin-replace.
- Pinned awslabs/aws-icons-for-plantuml to v18.0 in `diagrams/aws.pu`
  to match the Chocolatey PlantUML version and ensure reliable renders.