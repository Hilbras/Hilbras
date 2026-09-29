import { expect, expectNoProblems, gotoHome, test } from './fixtures';

/**
 * Mobile navigation, in a real touch context rather than a resized desktop
 * window. `isMobile` matters: it changes the viewport meta handling, the
 * synthetic pointer type, and which menu is rendered at all.
 */
test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('hides the desktop menu and shows a disclosure button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Products', exact: false }).first()).toBeHidden();
  });

  test('opens, exposes every navigation item, and closes', async ({ page, problems }) => {
    const open = page.getByRole('button', { name: 'Open navigation menu' });
    await open.tap();

    const close = page.getByRole('button', { name: 'Close navigation menu' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    await expect(close).toBeVisible();

    // The header still contains the desktop nav in the DOM — it is hidden by
    // CSS, not removed — so a bare `header nav` selector matches four elements.
    // The mobile panel is the disclosure the toggle controls.
    const menu = page.locator('header .disclosure-mobile');
    await expect(menu).toBeVisible();
    for (const name of ['Ecosystem', 'Technology', 'About']) {
      await expect(menu.getByRole('link', { name, exact: true }).first()).toBeVisible();
    }

    await close.tap();
    await page.waitForTimeout(400);
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    // The menu must actually be gone, not merely labelled closed.
    await expect(page.locator('header .disclosure-mobile')).toBeHidden();
    expectNoProblems(problems);
  });

  test('closes after following a link', async ({ page }) => {
    await page.getByRole('button', { name: 'Open navigation menu' }).tap();
    await page
      .locator('header .disclosure-mobile')
      .getByRole('link', { name: 'Ecosystem', exact: true })
      .first()
      .tap();
    await page.waitForTimeout(800);

    await expect(page.locator('#ecosystem')).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
  });

  test('does not trap the page or leave the body scroll-locked', async ({ page }) => {
    await page.getByRole('button', { name: 'Open navigation menu' }).tap();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Close navigation menu' }).tap();
    await page.waitForTimeout(500);

    const scrollable = await page.evaluate(() => {
      const before = window.scrollY;
      window.scrollTo({ top: before + 400, behavior: 'instant' });
      return window.scrollY > before;
    });
    expect(scrollable, 'the page cannot scroll after closing the menu').toBe(true);
  });

  test('remains usable at 320px with no horizontal overflow', async ({ page, problems }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoHome(page);
    await page.getByRole('button', { name: 'Open navigation menu' }).tap();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows, 'horizontal overflow at 320px').toBe(false);
    expectNoProblems(problems);
  });
});
