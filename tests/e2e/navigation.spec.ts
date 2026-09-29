import { expect, expectNoProblems, gotoHome, test } from './fixtures';

/**
 * Desktop navigation and the products disclosure.
 *
 * The disclosure has been the source of two real bugs: a close that could be
 * undone by a pending animation frame, and a hover-intent timer that re-opened
 * the panel after `Escape`. Both are races, so these tests act and then wait for
 * the frame that would have undone them rather than asserting synchronously.
 */

/** Lets any pending animation frame and disclosure timer land. */
async function settle(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForTimeout(250);
}

test.describe('desktop navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
  });

  test('renders the primary navigation and footer links', async ({ page }) => {
    const header = page.locator('header');
    for (const name of ['Products', 'Ecosystem', 'Technology', 'About']) {
      await expect(header.getByRole(name === 'Products' ? 'button' : 'link', { name })).toBeVisible();
    }
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('keeps the products panel closed until it is asked for', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Products/ });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-state="open"]')).toHaveCount(0);
  });

  test('opens on click and lists every product', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Products/ });
    await trigger.click();
    await settle(page);

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('header [data-state="open"]');
    await expect(panel).toBeVisible();

    for (const name of ['Hilbras SDK', 'HilPress', 'Hilbras OS', 'HilGit', 'Hilbras Spectra']) {
      await expect(panel.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test('closes on a second click', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Products/ });
    await trigger.click();
    await settle(page);
    await trigger.click();
    await settle(page);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes when the pointer leaves, after the intent delay', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Products/ });
    await trigger.click();
    await settle(page);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Far enough away to be outside the wrapper.
    await page.mouse.move(20, 700);
    // Past the 120ms close-intent delay.
    await page.waitForTimeout(400);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Products/ });
    await trigger.click();
    await settle(page);
    await page.keyboard.press('Escape');
    await settle(page);

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('does not reopen after Escape, even with the pointer still on the trigger', async ({ page, problems }) => {
    // This is the regression that a flaky unit test found: `mouseenter` queued an
    // open that landed ~80ms after Escape dismissed the panel, so the panel came
    // back on its own with a real mouse. Hovering deliberately and waiting well
    // past the intent delay is what makes it deterministic here.
    const trigger = page.getByRole('button', { name: /Products/ });
    await trigger.hover();
    await page.waitForTimeout(200);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('header [data-state="open"]')).toHaveCount(0);
    expectNoProblems(problems);
  });

  test('opens on hover, and not from focus alone', async ({ page }) => {
    // The 80ms intent delay is too short to assert on directly: Playwright's
    // round trip to Firefox is longer than the delay, so "still closed
    // immediately after hover" passes in Chromium and fails in Firefox while the
    // behaviour is identical. What actually matters, and is not a timing
    // question, is the accessibility requirement underneath it: focus must not
    // open the menu, or the first Enter on a keyboard-reachable button would
    // immediately undo itself.
    const trigger = page.getByRole('button', { name: /Products/ });

    await trigger.focus();
    await page.waitForTimeout(300);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('follows an in-page link to its section', async ({ page }) => {
    await page.locator('header').getByRole('link', { name: 'Ecosystem' }).click();
    await page.waitForTimeout(700);
    await expect(page.locator('#ecosystem')).toBeInViewport();
  });

  test('stays inside the viewport at short heights', async ({ page }) => {
    for (const height of [1000, 700, 560]) {
      await page.setViewportSize({ width: 1280, height });
      await gotoHome(page);
      const trigger = page.getByRole('button', { name: /Products/ });
      await trigger.click();
      await settle(page);

      const fits = await page.evaluate(() => {
        const panel = document.querySelector('header [data-state="open"] .card');
        if (!panel) return false;
        return panel.getBoundingClientRect().bottom <= window.innerHeight + 1;
      });
      expect(fits, `products panel overflows a ${height}px viewport`).toBe(true);
    }
  });
});
