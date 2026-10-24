import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import svelteConfig from './svelte.config.js';

export default defineConfig(
  {
    ignores: [
      '.output/',
      '.wxt/',
      '.claude/',
      'legacy/',
      'marketing/',
      'screenshots/',
      'node_modules/',
      // Separate projects with their own tooling: the website (Astro) and the videos.
      'website/',
      'video/',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser, svelteConfig } },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      'no-empty': ['error', { allowEmptyCatch: false }],
      // Canvas content is untrusted. Render text with textContent or {expr},
      // and HTML only through the sanitizer module.
      'svelte/no-at-html-tags': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]',
          message: 'Use textContent, or the sanitizer module for Canvas HTML.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Use DOM APIs, or the sanitizer module for Canvas HTML.',
        },
      ],
    },
  },
  {
    // Playwright reads fixture dependencies from the first parameter, which must
    // be a destructuring pattern even when empty: `async ({}, use) => ...`.
    files: ['e2e/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...ts.configs.disableTypeChecked,
  },
);
