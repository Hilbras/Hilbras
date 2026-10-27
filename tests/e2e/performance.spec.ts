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

    const viewport = page.viewportSize()!;

    // Polled, not sampled once. The canvas is resized by an effect after the
    // first paint, so a read taken immediately can catch the pre-resize size —
    // in WebKit that was exactly the document-sized value this test exists to
    // catch, producing a false alarm about the very bug it guards.
    const readCanvas = () =>
      page.evaluate(() => {
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

    // Polled on the *assertion*, not on the element's existence. The canvas is
    // in the DOM from the first frame and is resized by an effect afterwards, so
    // waiting for it to appear proves nothing; waiting for it to be the right
    // size is the actual wait.
    // The device pixel ratio is part of the answer, and only one engine gets it
    // wrong. Playwright's `Desktop Safari` descriptor sets
    // `deviceScaleFactor: 2`, so a correctly sized canvas has a backing store of
    // `viewport * dpr` — which is exactly the bound this test used to assert
    // against, making `height < viewport.height * 2` false for a canvas that is
    // right. The CSS box is the dpr-independent truth, and the backing store is
    // checked against it times the ratio.
    const dpr = await page.evaluate(() => window.devicePixelRatio);

    await expect
      .poll(async () => (await readCanvas())?.clientHeight ?? Number.POSITIVE_INFINITY, {
        message: 'the particle canvas is never sized to the viewport',
      })
      .toBeLessThanOrEqual(viewport.height);
    const canvas = await readCanvas();

    // The document is roughly 10,500px tall. A canvas that matches it means an
    // ancestor has become its containing block again, which is what turned a
    // 4.9 MB backing store into 58.1 MB.
    // The CSS box is the viewport, and the backing store is that box at the
    // device pixel ratio. A canvas matching the ~10,500px document means an
    // ancestor has become its containing block again — the bug that turned a
    // 4.9 MB backing store into 58.1 MB.
    expect(canvas!.clientHeight).toBeLessThanOrEqual(viewport.height);
    expect(canvas!.clientWidth).toBeLessThanOrEqual(viewport.width);
    expect(canvas!.height).toBe(canvas!.clientHeight * dpr);
    expect(canvas!.width).toBe(canvas!.clientWidth * dpr);
    expect(Math.abs(canvas!.cssHeight.replace('px', '').length)).toBeGreaterThan(0);
  });

  test('paints the particle field without blocking the main thread', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(1200);

    // Every pixel of the backing store, not a sparse sample. Sampling every
    // 4000th byte of the alpha channel reported "empty" for a canvas that was
    // plainly rendering, which is a good way to ship a false negative.
    const countPainted = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('.particle-canvas') as HTMLCanvasElement | null;
        if (!canvas) return -1;
        const context = canvas.getContext('2d');
        if (!context) return -1;
        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let lit = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit += 1;
        return lit;
      });

    // Polled, because the field starts after hydration and the first animation
    // frame, and a fixed wait is a race. WebKit gets there in about three
    // seconds on this host; a 1.2s sleep read an empty backing store and
    // reported a canvas that was in fact painting 11,617 pixels.
    await expect
      .poll(countPainted, { message: 'the particle canvas never painted anything' })
      .toBeGreaterThan(100);
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

  test('paints the heading without waiting for an animation', async ({ page }) => {
    // The single most important element on the site is its largest contentful
    // paint, and an element at `opacity: 0` is not painted at all.
    //
    // The hero used to fade in: its `h1` was in the document at 351ms and not
    // fully opaque until 1772ms. On a page that is prerendered specifically so
    // the first paint is real markup, that is a second and a half of invisible
    // headline. The same lesson as the removed page-enter animation, learned a
    // second time — the slide survives, the fade does not.
    await page.goto('/', { waitUntil: 'load' });

    const heading = await page.evaluate(() => {
      const h1 = document.querySelector('main h1');
      if (!h1) return null;
      const style = getComputedStyle(h1);
      return {
        opacity: Number(style.opacity),
        // A pending animation is fine — the slide is the entrance. A pending
        // *opacity* animation is what makes the element unpainted.
        animatingOpacity: h1
          .getAnimations()
          .some((animation) =>
            animation.effect?.getKeyframes().some((frame) => 'opacity' in frame),
          ),
      };
    });

    expect(heading, 'the homepage has no h1').not.toBeNull();
    expect(heading!.opacity, 'the heading is not fully opaque').toBe(1);
    expect(heading!.animatingOpacity, 'the heading is still fading in').toBe(false);
  });

  test('shows content in the initial viewport without scrolling', async ({ page }) => {
    // Same reasoning for the scroll reveals: content a reader is looking at must
    // become legible, not wait on an observer's scheduling and then on a
    // transition.
    //
    // Polled rather than sampled at a fixed moment, because "hidden" and "mid
    // fade" look identical at any single instant. An element that entered the
    // viewport after mount is revealed as soon as the observer re-evaluates and
    // then takes `--reveal-item-duration` to reach full opacity; a staggered
    // child may not start for another 700ms. What matters is that nothing
    // centred on screen is *permanently* hidden, and only a poll can tell those
    // two apart.
    for (const route of ['/', '/products', '/products/sdk', '/products/os']) {
      await page.goto(route, { waitUntil: 'load' });

      // "Substantially in view", meaning the element's centre is on screen. The
      // reveal threshold is 16% visible, so anything whose middle is showing has
      // long passed it — and a card whose top edge has only just entered is
      // correctly still hidden, because revealing it is what the scroll is for.
      const centredAndHidden = () =>
        page.evaluate(() =>
          [...document.querySelectorAll('.reveal')]
            .filter((element) => {
              const box = element.getBoundingClientRect();
              const centre = box.top + box.height / 2;
              const inView = centre > 0 && centre < window.innerHeight;
              return inView && Number(getComputedStyle(element).opacity) < 0.99;
            })
            .map((element) => (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)),
        );

      await expect
        .poll(centredAndHidden, {
          message: `content centred on screen but never revealed on ${route}`,
          timeout: 5_000,
        })
        .toEqual([]);
    }
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
