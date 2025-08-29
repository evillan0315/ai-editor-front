import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/compat';
import path from 'path';
import { fileURLToPath } from 'url';

// Plugins
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import { default as eslintConfigPrettier } from 'eslint-config-prettier/flat'; // Import the flat config from eslint-config-prettier

// Mimic CJS __dirname for FlatCompat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default tseslint.config(
  {
    // Global ignores
    ignores: ['dist', '.vite', 'node_modules', 'docs', 'public', '*.config.js', '*.config.ts'],
  },
  pluginJs.configs.recommended, // Standard ESLint recommended rules
  ...tseslint.configs.recommended, // TypeScript recommended rules
  ...tseslint.configs.stylistic, // TypeScript stylistic rules (optional)

  // Apply legacy react configs adapted by FlatCompat
  // These provide the base React rules.
  ...compat.extends('plugin:react/recommended', 'plugin:react/jsx-runtime'),

  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Include node globals for config files like vite.config.ts
      },
      parser: tseslint.parser, // Use TypeScript parser for TS/TSX files
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Crucial for type-aware linting.
        // It should point to the tsconfig.json files that include your application source files.
        // Add all relevant tsconfig files to ensure full coverage for linting.
        project: [
          './tsconfig.json',
          './tsconfig.app.json',
          './tsconfig.node.json', // Include if linting vite.config.ts etc.
        ],
      },
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
      prettier: prettierPlugin, // This plugin adds the `prettier/prettier` rule
    },
    rules: {
      // Custom React rules (overrides from recommended)
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform (React 17+)
      'react/prop-types': 'off', // Not needed with TypeScript

      // React Hooks rules (from recommended)
      ...reactHooks.configs.recommended.rules,

      // React Refresh rules for development
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'off', // Adjust as per project strictness
      '@typescript-eslint/no-unused-vars': 'off', // Disable TS rule, use unused-imports instead

      // Unused imports rules
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // General ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow console.warn/error

      // Prettier rule to report formatting issues as ESLint errors
      'prettier/prettier': 'error',
    },
  },
  // This must be the last configuration to disable all ESLint rules that conflict with Prettier.
  eslintConfigPrettier,
);
