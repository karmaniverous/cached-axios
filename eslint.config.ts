import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import { dirname } from 'path';
import { configs, plugin } from 'typescript-eslint';
import { fileURLToPath } from 'url';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [
      '**/.tsbuild/**',
      'coverage/**',
      'dist/**',
      'docs/**',
      'node_modules/**',
    ],
  },
  eslint.configs.recommended,
  ...configs.strictTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/require-await': 'off',
      'no-unused-vars': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
];
