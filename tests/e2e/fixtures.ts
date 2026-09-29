import { test as base, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Every console message, page error and failed request the page produced.
 *
 * React reports a hydration mismatch as `console.error` with a message that
 * starts "Hydration failed" or "There was an error while hydrating", and Vite
 * reports a failed chunk as a failed request. Neither throws, so a test that
 * only looks for thrown errors passes on a page that silently failed to
 * hydrate. Collecting them here means a spec can assert the list is empty
 * instead of each test remembering to attach its own listener.
 */
export type PageProblems = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  hydrationWarnings: string[];
};

function describe(message: ConsoleMessage): string {
  const location = message.location();
  const where = location?.url ? ` (${location.url}:${location.lineNumber})` : '';
  return `${message.type()}: ${message.text()}${where}`;
}

export const test = base.extend<{ problems: PageProblems }>({
  problems: async ({ page }, use) => {
    const problems: PageProblems = {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      hydrationWarnings: [],
    };

    page.on('console', (message) => {
      if (message.type() !== 'error' && message.type() !== 'warning') return;
      const text = describe(message);
      // React 18/19 hydration failures surface as a console error whose text
      // mentions hydration, and sometimes as a separate recoverable error.
      if (/hydrat|did not match|server (?:HTML|rendered)/i.test(text)) {
        problems.hydrationWarnings.push(text);
      }
      if (message.type() === 'error') problems.consoleErrors.push(text);
    });

    page.on('pageerror', (error) => problems.pageErrors.push(`pageerror: ${error.message}`));

    page.on('requestfailed', (request) => {
      // Favicon requests can be cancelled by the browser without being failures
      // of the page; anything else is real.
      if (request.url().endsWith('favicon.ico')) return;
      problems.failedRequests.push(
        `${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`,
      );
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        problems.failedRequests.push(`${response.url()} — HTTP ${response.status()}`);
      }
    });

    await use(problems);
  },
});

export { expect };

/**
 * Loads the homepage and waits until it is actually usable.
 *
 * Deliberately not `networkidle`. It never settles in Firefox — the page keeps
 * a connection alive that Chromium does not — and Playwright discourages it
 * because it is a proxy for "loaded" that is both flaky and indirect. Waiting
 * for the heading is the thing the tests actually need.
 */
export async function gotoHome(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'load' });
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
  // One frame, so hydration has had a chance to attach before anything is
  // measured.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));
}

/**
 * Walks the whole page so every scroll reveal has been triggered.
 *
 * The stylesheet sets `scroll-behavior: smooth`, so a programmatic scroll has to
 * be told to jump or the observer callbacks are outrun and the reveals are left
 * looking stuck — a false negative that reads exactly like a real bug.
 *
 * Callers should then assert with `expect.poll` rather than a fixed wait: the
 * reveals are CSS transitions driven by an observer, so "how long" is not a
 * question with a reliable answer and "has it happened yet" is.
 */
export async function scrollThroughPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    const end = document.documentElement.scrollHeight;
    for (let y = 0; y < end; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

/** The elements still not fully opaque, for a reveal assertion. */
export function stillHidden(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.reveal')]
      .filter((element) => Number(getComputedStyle(element).opacity) < 0.99)
      .map((element) => (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 50)),
  );
}

/**
 * Loads the homepage with no stored theme.
 *
 * `addInitScript` looks like the obvious way to clear storage, but it runs
 * before *every* navigation — including the reload a persistence test is trying
 * to observe, which wipes the very value under test. So the first load is spent
 * clearing, and the second is the one that matters.
 */
export async function gotoHomeWithoutStoredTheme(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
}

/** Asserts nothing went wrong in the console, the network, or hydration. */
export function expectNoProblems(problems: PageProblems): void {
  expect(problems.hydrationWarnings, 'hydration warnings').toEqual([]);
  expect(problems.pageErrors, 'uncaught exceptions').toEqual([]);
  expect(problems.failedRequests, 'failed requests').toEqual([]);
  expect(problems.consoleErrors, 'console errors').toEqual([]);
}
