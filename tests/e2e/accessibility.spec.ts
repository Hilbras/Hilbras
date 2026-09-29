import { expect, gotoHome, test } from './fixtures';

/**
 * Keyboard operation and the accessibility properties a browser can verify.
 *
 * This is not a substitute for a screen-reader pass or an axe audit; it covers
 * what Playwright can check directly — focus order, focus visibility, names,
 * roles, and that controls respond to the keyboard rather than only to a mouse.
 */
test.describe('accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
  });

  test('offers a skip link as the first tab stop', async ({ page }) => {
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toHaveText(/Skip to content/);
    await expect(focused).toHaveAttribute('href', '#main');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await expect(page.locator('main')).toBeFocused();
  });

  test('gives every tab stop a visible focus indicator', async ({ page }) => {
    const withoutRing: string[] = [];

    for (let i = 0; i < 26; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return {
          label: (element.getAttribute('aria-label') || element.textContent || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 40),
          tag: element.tagName.toLowerCase(),
          width: parseFloat(style.outlineWidth) || 0,
          style: style.outlineStyle,
          visible: box.width > 0 && box.height > 0 && style.visibility !== 'hidden',
        };
      });
      if (!info) continue;
      expect(info.visible, `"${info.label}" received focus but is invisible`).toBe(true);
      if (info.style === 'none' || info.width === 0) {
        withoutRing.push(`${info.tag} "${info.label}"`);
      }
    }

    expect(withoutRing, 'focusable elements with no visible focus ring').toEqual([]);
  });

  test('operates the products disclosure with the keyboard only', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Products/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Escape closes and hands focus back, so a keyboard user is never stranded.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('activates the theme toggle with the keyboard', async ({ page }) => {
    // Asserts that the control responds, rather than what the starting value
    // happens to be. The theme comes from localStorage first and the system
    // preference second, and the beforeEach has already navigated by the time
    // this test could set a media emulation — so a hardcoded expectation is a
    // test of the environment rather than of the button.
    const before = await page.locator('html').getAttribute('data-theme');
    expect(['dark', 'light']).toContain(before);

    const toggle = page.getByRole('button', { name: 'Toggle colour theme' });
    await toggle.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('html')).toHaveAttribute('data-theme', before === 'dark' ? 'light' : 'dark');
  });

  test('names every control, landmark, and product mark', async ({ page }) => {
    // Controls and landmarks must be exposed, not anonymous.
    const unnamed = await page.evaluate(() => {
      const problems: string[] = [];
      for (const element of document.querySelectorAll('button, a[href]')) {
        const name =
          element.getAttribute('aria-label') ||
          element.textContent?.trim() ||
          (element.querySelector('.sr-only')?.textContent ?? '').trim() ||
          (element.querySelector('img')?.getAttribute('alt') ?? '');
        if (!name) problems.push(`${element.tagName.toLowerCase()} ${element.getAttribute('href') ?? ''}`);
      }
      return problems;
    });
    expect(unnamed, 'interactive elements with no accessible name').toEqual([]);

    // Decorative graphics must be hidden from assistive technology, or a product
    // gets announced twice.
    const exposedMarks = await page.evaluate(
      () => document.querySelectorAll('svg:not([aria-hidden="true"])').length,
    );
    expect(exposedMarks, 'decorative SVGs exposed to assistive technology').toBe(0);

    // Exactly one main, one h1, and every section named by its own heading.
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const unnamedSections = await page.evaluate(() =>
      [...document.querySelectorAll('main > section')].filter((section) => {
        const id = section.getAttribute('aria-labelledby');
        return !id || !document.getElementById(id);
      }).length,
    );
    expect(unnamedSections, 'sections without a resolvable aria-labelledby').toBe(0);
  });

  test('keeps heading levels in order', async ({ page }) => {
    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')]
        .filter((heading) => heading.closest('noscript') === null)
        .map((heading) => ({
          level: Number(heading.tagName[1]),
          text: (heading.textContent ?? '').trim().slice(0, 40),
        })),
    );

    expect(levels[0].level, 'the document does not start at h1').toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      const jump = levels[i].level - levels[i - 1].level;
      expect(
        jump,
        `"${levels[i].text}" (h${levels[i].level}) follows "${levels[i - 1].text}" (h${levels[i - 1].level})`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test('keeps the visible focus order matching the reading order', async ({ page }) => {
    const order: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const element = document.activeElement;
        return (element?.getAttribute('aria-label') || element?.textContent || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 24);
      });
      order.push(label);
    }
    // Skip link, brand, products, then the section links in page order.
    expect(order[0]).toMatch(/Skip to content/);
    expect(order[1]).toMatch(/Hilbras/);
    expect(order[2]).toMatch(/Products/);
    expect(order[3]).toMatch(/Ecosystem/);
    expect(order[4]).toMatch(/Technology/);
    expect(order[5]).toMatch(/About/);
  });
});
