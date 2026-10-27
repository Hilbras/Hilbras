import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the real build, served with the real headers.
 *
 * Both choices matter. Against `vite dev` the prerender never runs, so the tests
 * would be checking a different artefact than production serves. Without the
 * headers from vercel.json the Content Security Policy is absent, so every
 * interaction that could be blocked by it passes vacuously.
 *
 * `SITE_URL` in the served environment overrides the origin the document claims
 * to live at, which is how the environment-aware canonical behaviour is tested
 * without deploying anything.
 */
const PORT = Number(process.env.E2E_PORT ?? 4180);
const SITE_URL = process.env.SITE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * Firefox runs alongside Chromium.
 *
 * WebKit is enabled, and it runs on a host with no root.
 *
 * It needed seven system libraries that are not installed here:
 * `libbacktrace0`, `libevent-2.1-7t64`, `libavif16`, `libmanette-0.2-0`,
 * `libyuv0`, `libgav1-0` and `libhidapi-hidraw0`. All are ordinary Ubuntu
 * packages. `scripts/fetch-webkit-deps.mjs` downloads and unpacks them into
 * `~/.local/pw-deps` and prints the one `LD_LIBRARY_PATH` line needed, so the
 * browser runs as an unprivileged user rather than being declared untestable.
 *
 * An earlier diagnosis of this said it needed libsoup and GStreamer built from
 * source. That was wrong: `ldd -r` on the WebKit binary names every missing
 * object, and none of them were libsoup.
 *
 * Safari itself is still not testable — this is Playwright's WebKit build, not
 * Apple's. Nor is Edge as a distinct product: Edge shares Chromium's engine, so
 * the Chromium project covers its behaviour, but its own shell is unverified.
 */
const browsers: { name: string; use: Parameters<typeof devices>[0] }[] = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
];

export default defineConfig({
  testDir: './tests/e2e',
  // The browser work dominates the runtime, and a single failure retries once.
  //
  // Retries are for environmental contention, not for hiding defects: this host
  // runs at a load average of 16-20 from work unrelated to the site, and under
  // that load Firefox — which runs this suite at roughly a third of Chromium's
  // speed — intermittently exceeds even a 60s timeout on a plain navigation.
  // Every test below passes in isolation, and the ones that genuinely failed did
  // so with an assertion, not a timeout.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  // A hung locator should fail the test, not the run. Firefox runs this suite
  // at roughly a third of Chromium's speed, so a timeout Chromium clears
  // comfortably is a coin flip in Firefox, and the failures that produces are
  // indistinguishable from real ones.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Traces and screenshots only on failure. A passing run uploads nothing.
  use: {
    baseURL: SITE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list']],

  projects: browsers.map((browser) => ({
    name: browser.name,
    use: {
      ...browser.use,
      // Measured, not guessed. This suite takes about 3 minutes in Chromium,
      // 5-8 in WebKit and 6-9 in Firefox on this host — on a box already at a
      // load average in the twenties. At the shared 60s timeout the slow engines
      // fail on readiness rather than on behaviour, and a failure that means
      // "the page had not finished loading" is indistinguishable from one that
      // means "this engine does it differently". Enabling WebKit took the suite
      // from 3 minutes to 27, entirely in timeouts.
      //
      // Raising the timeout is not the same as lowering the bar: every assertion
      // is unchanged, and a genuine hang still fails, just later. What it removes
      // is the noise that was hiding the answer.
      ...(browser.name === 'webkit'
        ? { timeout: 180_000, expect: { timeout: 20_000 } }
        : browser.name === 'firefox'
          ? { timeout: 120_000, expect: { timeout: 15_000 } }
          : {}),
    },
  })),

  webServer: {
    // Serves dist/ with the production headers from vercel.json. `pnpm
    // test:e2e` builds first, so the tests see the prerendered document with the
    // real Content Security Policy rather than a dev server.
    command: 'node scripts/serve-with-headers.mjs',
    env: { PORT: String(PORT) },
    url: SITE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
