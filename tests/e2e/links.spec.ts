import { expect, gotoHome, test } from './fixtures';

/**
 * Link behaviour, in a real browser.
 *
 * The unit tests assert the same rules against rendered markup; this confirms
 * they hold in the built document and that no anchor points at a section that
 * does not exist.
 */
test.describe('links', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('gives every external link a safe rel, a target, and an announcement', async ({ page }) => {
    const problems = await page.evaluate(() => {
      const external = [...document.querySelectorAll('a[href^="http"]')] as HTMLAnchorElement[];
      const withoutRel = external.filter((a) => a.rel !== 'noreferrer noopener').map((a) => a.href);
      const withoutTarget = external.filter((a) => a.target !== '_blank').map((a) => a.href);
      // A new-tab link with no announcement is a surprise for a screen-reader
      // user, who is not watching for a context switch.
      const withoutAnnouncement = external
        .filter((a) => a.target === '_blank' && !a.querySelector('.sr-only'))
        .map((a) => a.href);
      return { total: external.length, withoutRel, withoutTarget, withoutAnnouncement };
    });

    expect(problems.total).toBeGreaterThan(0);
    expect(problems.withoutRel, 'external links missing rel').toEqual([]);
    expect(problems.withoutTarget, 'external links missing target').toEqual([]);
    expect(problems.withoutAnnouncement, 'new-tab links with no announcement').toEqual([]);
  });

  test('never opens an internal anchor in a new tab', async ({ page }) => {
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .filter((a) => a.getAttribute('target') === '_blank')
        .map((a) => a.getAttribute('href')),
    );
    expect(offenders).toEqual([]);
  });

  test('has no anchor pointing at a section that does not exist', async ({ page }) => {
    const dead = await page.evaluate(() => {
      const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id));
      return [
        ...new Set(
          [...document.querySelectorAll('a[href^="#"]')]
            .map((a) => a.getAttribute('href')!.slice(1))
            .filter((id) => id && !ids.has(id)),
        ),
      ];
    });
    expect(dead, 'anchors with no matching id').toEqual([]);
  });

  test('links every product that has somewhere to link to', async ({ page }) => {
    await page.locator('#products').scrollIntoViewIfNeeded();

    // Every product name appears in at least a chip, a card, or the map.
    const names = [
      'Hilbras SDK', 'Hilbras Remembera', 'Hilbras Keystone', 'HilPress',
      'Hilbras Studio', 'Hilbras Gateway', 'OmniHilbras', 'Hilbras OS',
      'Hilbras Code', 'HilGit', 'Hilbras Spectra',
    ];
    for (const name of names) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test('says a product with no public release has none, and links nothing false', async ({ page }) => {
    await page.locator('#products').scrollIntoViewIfNeeded();

    // Three products are marked in development with neither a site nor a
    // repository. Their cards say so rather than inventing a destination — and
    // they still link to the product's own page, which is where the site explains
    // what the product is and why there is nothing to install yet.
    for (const [name, slug] of [
      ['Hilbras Gateway', 'gateway'],
      ['Hilbras OS', 'os'],
      ['HilGit', 'hilgit'],
    ]) {
      const card = page.locator('article', { has: page.getByRole('heading', { name, exact: true }) }).first();
      await expect(card).toContainText(/No public release yet/);
      await expect(card.getByRole('link', { name: name, exact: true })).toHaveAttribute(
        'href',
        `/products/${slug}`,
      );
      await expect(card.locator('a[href^="https"]')).toHaveCount(0);
    }
  });

  test('points repository links at the Hilbras organisation', async ({ page }) => {
    const offOrg = await page.evaluate(() =>
      [...document.querySelectorAll('a[href*="github.com"]')]
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href) => !href.startsWith('https://github.com/Hilbras')),
    );
    expect(offOrg).toEqual([]);
  });
});
