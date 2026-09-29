import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // happy-dom rather than jsdom: the component tests need a DOM and a
    // `matchMedia`, not a full browser emulation.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // The build output and the compiled SSR bundle are not source.
    exclude: ['node_modules', 'dist', '.ssr'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      // A threshold over the whole tree would be a number nobody could act on.
      // The data layer is the part where a regression is silent — a product with
      // a broken URL still renders — so that is what is held to a bar.
      //
      // validation.ts is excluded deliberately rather than by lowering the
      // number. Its error branches only execute on invalid data, which is what
      // scripts/verify-validator.mjs does: nine cases, each breaking one rule,
      // each asserted to fail the build. Unit-testing them would mean asserting
      // that a deliberately corrupted object throws, which tests the test rather
      // than the validator.
      thresholds: {
        'src/data/areas.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/data/links.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        'src/data/structuredData.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  },
});
