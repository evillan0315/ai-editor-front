import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
// Import eslint-plugin-prettier directly
import pluginPrettier from 'eslint-plugin-prettier';
// CORRECTED IMPORT PATH for FlatCompat
import { FlatCompat } from '@eslint/compat/flat';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __filename and __dirname for ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize FlatCompat for compatibility with legacy configs (like eslint-plugin-react)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  // If your plugins or shareable configs are not being resolved correctly,
  // uncomment and adjust resolvePluginsRelativeTo:
  // resolvePluginsRelativeTo: __dirname,
});

export default tseslint.config(
  {
    // Global ignores for files not to be linted
    ignores: [
      'dist',
      'node_modules',
      '.next', // If Next.js were involved
      '*.config.{js,ts,cjs}', // eslint.config.ts, vite.config.ts etc.
      'public',
      '.env',
      '.env.*',
      '*.d.ts',
      'coverage',
      'temp',
      'out',
      // Any other generated or non-source files
    ],
  },
  pluginJs.configs.recommended, // ESLint's built-in recommended rules

  ...tseslint.configs.recommended, // TypeScript ESLint's recommended rules

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': eslintPluginReactHooks,
      //'react-refresh': eslintPluginReactRefresh,
      'unused-imports': eslintPluginUnusedImports,
      // Add eslint-plugin-prettier directly
      prettier: pluginPrettier,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Define which tsconfig files ESLint should use
        project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // Add specific globals if your environment introduces them (e.g., Vite's `import.meta`)
        // 'import.meta': 'readonly', // Usually implicitly handled by TS config and Vite.
      },
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version from package.json
      },
      // Configure import resolver for TypeScript aliases
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json'],
        },
        node: true,
      },
    },
    rules: {
      // General ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-const': 'error',

      // React specific rules (using compat for recommended configurations)
      ...compat.extends('plugin:react/recommended')[0].rules,
      ...compat.extends('plugin:react/jsx-runtime')[0].rules,
      'react/react-in-jsx-scope': 'off', // Not needed for React 17+ with new JSX transform
      'react/prop-types': 'off', // Redundant with TypeScript

      // React Hooks rules (can be used directly if not using compat for them)
      ...eslintPluginReactHooks.configs.recommended.rules,

      // React Refresh plugin rule for Vite HMR
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // TypeScript ESLint rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Unused imports plugin rules
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Prettier rule - enforces Prettier formatting
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'lf', // Consistent line endings
          tabWidth: 2,
          semi: true,
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
        },
      ],
    },
  },
  // eslint-config-prettier must be the last configuration in the array to turn off all conflicting rules.
  eslintConfigPrettier,
);
