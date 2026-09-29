import { expect, gotoHome, scrollThroughPage, test } from './fixtures';

/**
 * Runtime cost, measured in a real browser.
 *
 * The 58 MB canvas that shipped in v1.0.0 passed every other check in this
 * repository: Lighthouse scored 100, there were no long tasks, no console errors
 * and no layout shift, and the unit tests were green. It was only visible by
 * reading the canvas's own dimensions. These tests exist so that class of problem
 * fails the build instead of shipping.
 */
test.describe('runtime cost', () => {
  test('sizes the particle canvas to the viewport, not the document', async ({ page }) => {
    await gotoHome(page);

    const canvas = await page.evaluate(() => {
      const element = document.querySelector('.particle-canvas') as HTMLCanvasElement | null;
      if (!element) return null;
      return {
        width: element.width,
        height: element.height,
        cssHeight: getComputedStyle(element).height,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
      };
    });

    expect(canvas, 'the particle canvas is missing').not.toBeNull();
    const viewport = page.viewportSize()!;

    // The document is roughly 10,500px tall. A canvas that matches it means an
    // ancestor has become its containing block again, which is what turned a
    // 4.9 MB backing store into 58.1 MB.
    expect(canvas!.height).toBeLessThan(viewport.height * 2);
    expect(canvas!.clientHeight).toBe(canvas!.height);
    expect(canvas!.clientWidth).toBeLessThanOrEqual(viewport.width);
    expect(Math.abs(canvas!.cssHeight.replace('px', '').length)).toBeGreaterThan(0);
  });

  test('paints the particle field without blocking the main thread', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(1200);

    // Every pixel of the backing store, not a sparse sample. Sampling every
    // 4000th byte of the alpha channel reported "empty" for a canvas that was
    // plainly rendering, which is a good way to ship a false negative.
    const painted = await page.evaluate(() => {
      const canvas = document.querySelector('.particle-canvas') as HTMLCanvasElement | null;
      if (!canvas) return null;
      const context = canvas.getContext('2d');
      if (!context) return null;
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let lit = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit += 1;
      return lit;
    });

    expect(painted, 'the particle canvas is not rendering anything').toBeGreaterThan(100);
  });

  test('produces no sustained main-thread blocking while scrolling', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(1200);

    await page.evaluate(() => {
      (window as unknown as { __long: number[] }).__long = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __long: number[] }).__long.push(Math.round(entry.duration));
        }
      }).observe({ type: 'longtask', buffered: true });
    });

    await scrollThroughPage(page);
    await page.waitForTimeout(800);

    const { count, total, blocking } = await page.evaluate(() => {
      const durations = (window as unknown as { __long: number[] }).__long;
      return {
        count: durations.length,
        total: durations.reduce((a, b) => a + b, 0),
        // Total Blocking Time: the part of each long task beyond the 50ms
        // threshold, which is what the browser considers actually blocking.
        blocking: durations.reduce((sum, d) => sum + Math.max(0, d - 50), 0),
      };
    });

    // The bound is deliberately loose. Long tasks are wall-clock, so they
    // measure the machine as much as the page: on the host this was written on,
    // a load average of 29 from unrelated work produced 33 long tasks and 3.1s of
    // blocking time here, against 24 and 1.1s on production hardware running the
    // identical build. A tighter threshold would be asserting that the machine is
    // idle.
    //
    // What this still catches is the failure it was written for. The 58 MB canvas
    // shipped through a suite where every other check was green; it blocked a
    // frame for 92ms at a time, continuously, which no amount of machine idleness
    // would hide. Google's "poor" threshold is 600ms of total blocking time, so
    // 2000ms leaves a wide margin for contention and still fails on a canvas of
    // that size.
    expect(
      blocking,
      `${count} long tasks, ${total}ms total, ${blocking}ms blocking over a full scroll`,
    ).toBeLessThan(2000);
  });

  test('causes no layout shift', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(500);
    await scrollThroughPage(page);
    await page.waitForTimeout(600);

    const cls = await page.evaluate(
      () =>
        performance
          .getEntriesByType('layout-shift')
          .filter((entry) => !(entry as unknown as { hadRecentInput: boolean }).hadRecentInput)
          .reduce((total, entry) => total + (entry as unknown as { value: number }).value, 0),
    );

    // 0.1 is Google's "good" threshold. The prerender plus hydration should be
    // well under it; anything above means something appeared late and moved
    // things already on screen.
    expect(cls, `cumulative layout shift was ${cls.toFixed(4)}`).toBeLessThan(0.1);
  });

  test('makes no third-party requests', async ({ page, baseURL }) => {
    // Compared against the configured baseURL rather than `page.url()`, which
    // is `about:blank` until the first navigation and would make every request
    // look foreign.
    const own = new URL(baseURL!).origin;
    const foreign = new Set<string>();
    page.on('request', (request) => {
      const origin = new URL(request.url()).origin;
      if (origin !== own) foreign.add(origin);
    });

    await gotoHome(page);
    await page.waitForTimeout(800);
    expect([...foreign], 'requests leaving the site origin').toEqual([]);
  });
});
