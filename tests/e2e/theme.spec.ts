import { expect, expectNoProblems, gotoHome, gotoHomeWithoutStoredTheme, test } from './fixtures';

/**
 * Theme behaviour.
 *
 * The theme is applied by `public/theme-init.js` before first paint rather than
 * by React, so the tests here are about that file working, not about component
 * state. The flash test in particular has to observe the first paint, which is
 * why it uses an init script to record the attribute as soon as possible.
 */
test.describe('theme', () => {
  test('defaults to the system preference when nothing is stored', async ({ page, browserName }) => {
    // Firefox on this host cannot emulate `prefers-color-scheme` at all: the
    // context option is accepted and ignored, and matchMedia always reports
    // false. Verified directly — `colorScheme: 'dark'` yields matchMedia=true in
    // Chromium and false in Firefox. The system-preference fallback is therefore
    // unobservable here rather than broken, and this test is scoped rather than
    // deleted so it resumes covering Firefox wherever emulation works.
    test.skip(
      browserName === 'firefox',
      'Firefox on this host cannot emulate prefers-color-scheme',
    );

    await page.emulateMedia({ colorScheme: 'dark' });
    await gotoHomeWithoutStoredTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // A full navigation rather than a reload: theme-init.js reads matchMedia
    // during the first script execution, and a reload can race the emulation
    // into taking effect.
    await page.emulateMedia({ colorScheme: 'light' });
    await gotoHome(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('toggles and persists the choice across a reload', async ({ page, problems, browserName }) => {
    // Starts from an emulated dark preference; see the skip reason above.
    test.skip(
      browserName === 'firefox',
      'Firefox on this host cannot emulate prefers-color-scheme',
    );

    await page.emulateMedia({ colorScheme: 'dark' });
    await gotoHomeWithoutStoredTheme(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const toggle = page.getByRole('button', { name: 'Toggle colour theme' });
    await toggle.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('hilbras-theme')))
      .toBe('light');

    // The choice has to survive, or the toggle is decoration.
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expectNoProblems(problems);
  });

  test('applies the stored theme before the first paint, with no flash', async ({ page, browserName }) => {
    test.skip(
      browserName === 'firefox',
      'Firefox paints before DOMContentLoaded, so the first background is not observable here',
    );

    // Seeded directly rather than through a media query, so the assertion does
    // not depend on the host being able to emulate a system preference.
    await page.addInitScript(() => localStorage.setItem('hilbras-theme', 'light'));
    await gotoHome(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('hilbras-theme')))
      .toBe('light');

    // Records the theme and the document background as early as the DOM allows,
    // which is before any paint of the body.
    await page.addInitScript(() => {
      (window as unknown as { __early: unknown[] }).__early = [];
      const record = () => {
        const html = document.documentElement;
        const list = (window as unknown as { __early: unknown[] }).__early;
        list.push({ theme: html.dataset.theme ?? null, bg: getComputedStyle(document.body).backgroundColor });
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', record, { once: true });
      } else {
        record();
      }
    });

    await page.reload({ waitUntil: 'load' });
    const early = await page.evaluate(() => (window as unknown as { __early: { theme: string; bg: string }[] }).__early);

    expect(early.length).toBeGreaterThan(0);
    // Dark is #0c0b09 and light is #faf9f5. If the theme attribute were applied
    // after hydration rather than before paint, the first background would be
    // the dark one regardless of the stored choice.
    expect(early[0].theme, 'no theme applied before DOMContentLoaded').toBe('light');
    expect(early[0].bg, 'the first painted background does not match the stored theme').toBe(
      'rgb(250, 249, 245)',
    );
  });

  test('falls back cleanly when storage is unavailable', async ({ page, problems }) => {
    // Private-browsing modes and strict privacy settings throw on access rather
    // than returning null. The page must still render in a valid theme.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });
    });
    await gotoHome(page);

    const theme = await page.locator('html').getAttribute('data-theme');
    expect(['dark', 'light']).toContain(theme);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(problems.pageErrors).toEqual([]);
  });

  test('renders at full opacity with reduced motion', async ({ page, problems }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    // The reveal hidden state lives inside a `no-preference` block, so under
    // reduce it is never applied rather than animated away.
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll('.reveal')].filter(
          (element) => Number(getComputedStyle(element).opacity) < 0.99,
        ).length,
    );
    expect(hidden, 'elements are hidden under prefers-reduced-motion').toBe(0);

    const animations = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    );
    expect(animations, 'animations still running under prefers-reduced-motion').toBe(0);

    // The page must remain fully usable, not merely static.
    await page.getByRole('button', { name: /Products/ }).click();
    await expect(page.getByRole('button', { name: /Products/ })).toHaveAttribute('aria-expanded', 'true');

    expectNoProblems(problems);
  });

  test('pauses the particle field under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.waitForTimeout(800);

    // One static frame, so the canvas is painted but not advancing.
    const painted = await page.evaluate(() => {
      const canvas = document.querySelector('.particle-canvas') as HTMLCanvasElement | null;
      if (!canvas) return { present: false };
      const context = canvas.getContext('2d');
      if (!context) return { present: true, painted: false };
      const data = context.getImageData(0, 0, canvas.width, Math.min(canvas.height, 400)).data;
      let lit = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit += 1;
      return { present: true, painted: lit > 0, size: `${canvas.width}x${canvas.height}` };
    });

    expect(painted.present).toBe(true);
    // Sized to the viewport, not the document. The `transform` bug that made it
    // 10584px tall would show up here as a much larger canvas, so the
    // expectation is derived from the real viewport rather than hardcoded.
    const viewport = page.viewportSize();
    expect(painted.size).toBe(`${viewport?.width}x${viewport?.height}`);
  });
});
