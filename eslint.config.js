import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Generated output, never source.
  { ignores: ['dist', 'coverage', 'node_modules', '.ssr'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js', 'playwright.config.ts', 'vitest.config.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // The end-to-end tests are not React and do not run in a browser document.
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Playwright fixtures name their callback `use`, which is the React hook
      // convention and nothing to do with React. The rule cannot tell the
      // difference, so it is off here rather than suppressed inline eight times.
      'react-hooks/rules-of-hooks': 'off',
    },
  },
);
