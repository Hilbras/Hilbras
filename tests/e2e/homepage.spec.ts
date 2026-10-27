import { expect, expectNoProblems, gotoHome, scrollThroughPage, stillHidden, test } from './fixtures';

/**
 * The page loads, renders, and does not error.
 *
 * These are the assertions that would catch a prerender that silently stopped
 * injecting, a chunk that failed to load, or a React hydration mismatch — all of
 * which build green and are invisible without a browser.
 */
test.describe('homepage', () => {
  test('loads and renders its main regions', async ({ page, problems }) => {
    await gotoHome(page);

    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Build\. Connect\. Create\./);
    await expect(page.locator('#products')).toBeVisible();

    expectNoProblems(problems);
  });

  test('serves the full page in the HTML, not only after hydration', async ({ page }) => {
    // Fetched without executing anything. This is what GPTBot, ClaudeBot,
    // PerplexityBot and most archiving tools receive.
    const response = await page.request.get('/');
    const html = await response.text();

    expect(response.status()).toBe(200);
    // The prerender step is the reason the document is not empty.
    expect(html).toContain('<div id="root"><div');
    expect(html).toContain('Hilbras SDK');
    expect(html).toContain('Six areas');
    expect(html).toMatch(/application\/ld\+json/);

    // Not just markup: a crawler cannot read a display:none hero.
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(stripped.length).toBeGreaterThan(4000);
  });

  test('has no hydration errors', async ({ page, problems }) => {
    await gotoHome(page);
    await page.waitForTimeout(1200);
    expect(problems.hydrationWarnings).toEqual([]);
    expect(problems.pageErrors).toEqual([]);
  });

  test('reuses the server DOM instead of replacing it', async ({ page }) => {
    await gotoHome(page);

    // React replacing the markup on hydration is legal but loses the prerender's
    // benefit and usually signals a mismatch. Tag an element before hydration
    // settles and check it survives.
    await page.evaluate(() => {
      const heading = document.querySelector('#products h2');
      if (heading) heading.setAttribute('data-hydration-probe', '1');
    });
    await page.waitForTimeout(600);
    await expect(page.locator('[data-hydration-probe="1"]')).toHaveCount(1);
  });

  test('completes every scroll reveal once scrolled through', async ({ page, problems }) => {
    await gotoHome(page);
    await scrollThroughPage(page);

    // Polled, not waited: the reveal is a CSS transition kicked off by an
    // IntersectionObserver, so there is no fixed duration to sleep for.
    await expect
      // No hardcoded timeout: this uses the configured per-engine `expect`
      // timeout, which is roughly nine times longer for WebKit than for
      // Chromium. A fixed 8s overrode that and failed on readiness rather than
      // on behaviour, with 39 elements still mid-transition.
      .poll(() => stillHidden(page), { message: 'elements left invisible after a full scroll' })
      .toEqual([]);
    expect(problems.consoleErrors).toEqual([]);
  });

  test('shows every product from the data layer', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#products').scrollIntoViewIfNeeded();

    const names = ['Hilbras SDK', 'Hilbras Remembera', 'Hilbras Keystone', 'HilPress', 'Hilbras Studio',
      'Hilbras Gateway', 'OmniHilbras', 'OmniNode', 'Hilbras OS', 'Hilbras Code', 'OmniCode', 'HilGit',
      'Hilbras Spectra'];
    for (const name of names) {
      await expect(page.getByRole('heading', { name, exact: true }).first()).toBeVisible();
    }
  });

  test('does not scroll horizontally at any tested width', async ({ page }) => {
    for (const width of [320, 390, 834, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoHome(page);
      // "Can the user scroll sideways?" — asked directly, by trying.
      //
      // The obvious check, `scrollWidth > clientWidth`, is wrong, and only a
      // third engine reveals it: `clientWidth` excludes a classic scrollbar and
      // `scrollWidth` does not. WebKit on Linux gives a 310px content box in a
      // 320px viewport, so on a page that cannot scroll sideways *at all* the
      // comparison reads true. Chromium has overlay scrollbars, where
      // `clientWidth` equals the viewport, so the same bug is invisible there.
      //
      // Scrolling right and asking whether the document moved tests the thing
      // the reader would experience, and no scrollbar accounting can fake it.
      const sideways = await page.evaluate(() => {
        const root = document.documentElement;
        const scroller = document.scrollingElement ?? root;
        const before = scroller.scrollLeft;
        // The site sets `scroll-behavior: smooth`, which would animate and make
        // the read below meaningless.
        scroller.scrollTo({ left: 9999, behavior: 'instant' });
        const moved = scroller.scrollLeft;
        scroller.scrollTo({ left: before, behavior: 'instant' });
        return {
          moved,
          scrollWidth: scroller.scrollWidth,
          innerWidth: window.innerWidth,
          // How wide a classic scrollbar is here. Zero for Chromium, which uses
          // overlay scrollbars, so the same page measures differently in each.
          scrollbar: window.innerWidth - root.clientWidth,
        };
      });
      expect(
        sideways.scrollWidth - sideways.scrollbar,
        `content extends past the viewport at ${width}px ` +
          `(scrollWidth ${sideways.scrollWidth}, scrollbar ${sideways.scrollbar}, viewport ${sideways.innerWidth})`,
      ).toBeLessThanOrEqual(sideways.innerWidth);

      // And the reader must not be able to shove the page sideways. Allow the
      // scrollbar's own width: a document with a vertical scrollbar always has
      // that much slack, in every engine, and reporting it as overflow is how
      // this test managed to fail on a page that cannot scroll sideways at all.
      expect(sideways.moved, `the page scrolls sideways at ${width}px`).toBeLessThanOrEqual(
        sideways.scrollbar,
      );
    }
  });
});
