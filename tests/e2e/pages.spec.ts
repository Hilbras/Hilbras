import { expect, gotoHome, test } from './fixtures';
import { areas, products } from '../../src/data/areas';
import { counts } from '../../src/data/site';

/**
 * The product pages, the index, and the 404.
 *
 * These routes are prerendered like the homepage, so the same failure applies:
 * a document that builds green and arrives with nothing in it. Each one is
 * checked for content, its own canonical, and a working back path.
 */
/**
 * The product registry, read rather than restated.
 *
 * This file used to carry its own eleven-row list of product slugs and names,
 * which was an eleventh copy of the truth — and a copy that had to be edited by
 * hand when a product was added, or the suite would go on asserting a page that
 * no longer existed. Reading the registry makes the assertions below about
 * *completeness*: that the index shows every product the data layer declares,
 * exactly once, rather than that it shows eleven of them.
 */
const PRODUCTS = products.map((product) => [product.id, product.name] as const);
const PRODUCT_PATHS = new Set(products.map((product) => `/products/${product.id}`));
const AREA_NAMES = areas.map((area) => area.name);

test.describe('product pages', () => {
  test('every product has a page, with its own canonical', async ({ page, problems }) => {
    for (const [slug, name] of PRODUCTS) {
      await page.goto(`/products/${slug}`, { waitUntil: 'load' });

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
      await expect(page.locator('main')).toBeVisible();

      // Its own address, not the homepage's. A product page serving the
      // homepage canonical tells a search engine the two are one document.
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, name).toMatch(new RegExp(`/products/${slug}$`));

      // Exactly one h1 on every page, or the outline is wrong everywhere.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    }

    expect(problems.consoleErrors).toEqual([]);
    expect(problems.failedRequests).toEqual([]);
  });

  test('a product page explains its maturity rather than only colouring a pill', async ({ page }) => {
    await page.goto('/products/gateway', { waitUntil: 'load' });
    // Marked "in development" with no public release, and the page says so in
    // words. The roadmap is explicit that an unfinished product must never read
    // as production-ready.
    await expect(page.getByText('In development').first()).toBeVisible();
    await expect(page.getByText(/No public release yet/)).toBeVisible();
    await expect(page.getByText(/Nothing here is a supported release yet/)).toBeVisible();
  });

  test('shows how to install the published ones, and omits it for the rest', async ({ page }) => {
    // Five of the eleven have a registry package. The other six get no section
    // at all, rather than an empty heading — an "Install it" heading on a
    // product with nothing to install is worse than no heading.
    const PUBLISHED = [
      ['sdk', '@hilbras/sdk'],
      ['keystone', '@hilbras/keystone'],
      ['remembera', '@hilbras/remembra'],
      ['omnihilbras', '@hilbras/omnihilbras'],
      ['code', 'hilbras-code'],
    ] as const;
    const UNPUBLISHED = ['gateway', 'os', 'hilgit', 'hilpress', 'spectra', 'studio'];

    for (const [slug, packageName] of PUBLISHED) {
      await page.goto(`/products/${slug}`, { waitUntil: 'load' });
      const section = page.locator('section[aria-labelledby="developer-heading"]');
      await expect(section, slug).toBeVisible();
      await expect(section.getByText(packageName, { exact: true }), slug).toBeVisible();
      // The version is dated, because a registry version goes out of date and a
      // page quoting an old one without saying when is a small lie.
      await expect(section.getByText(/registry on \d{4}-\d{2}-\d{2}/), slug).toBeVisible();
      await expect(section.getByText(/npm (install|i) /), slug).toBeVisible();
    }

    for (const slug of UNPUBLISHED) {
      await page.goto(`/products/${slug}`, { waitUntil: 'load' });
      await expect(page.getByRole('heading', { name: 'Install it' }), slug).toHaveCount(0);
    }
  });

  test('publishes softwareVersion only for the products on a registry', async ({ page }) => {
    /** The product node from a page's JSON-LD — not the organisation or the site. */
    const productNode = async (slug: string) => {
      await page.goto(`/products/${slug}`, { waitUntil: 'load' });
      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      const graph = JSON.parse(raw ?? '{}')['@graph'] as Record<string, unknown>[];
      const node = graph.find((entry) => entry['@type'] !== 'Organization' && entry['@type'] !== 'WebSite');
      return node as Record<string, unknown>;
    };

    for (const [slug, version] of [
      ['sdk', '3.2.0'],
      ['keystone', '3.5.3'],
    ] as const) {
      const node = await productNode(slug);
      expect(node.softwareVersion, slug).toBe(version);
      expect(String(node.license), slug).toContain('spdx.org');
    }

    // A product with nothing published carries neither. The property used to
    // carry a status sentence, which was a misuse of it, and had been removed;
    // it is back only where it is genuinely a version.
    const unpublished = await productNode('gateway');
    expect(unpublished.softwareVersion).toBeUndefined();
    expect(unpublished.license).toBeUndefined();
  });

  test('a product page links its repository and its neighbours', async ({ page }) => {
    await page.goto('/products/sdk', { waitUntil: 'load' });

    const source = page.getByRole('link', { name: /View the source/ });
    await expect(source).toHaveAttribute('href', 'https://github.com/Hilbras/Hilbras-ai-sdk');
    await expect(source).toHaveAttribute('rel', 'noreferrer noopener');

    // Neighbouring work, each linking to its own page.
    const related = page.locator('section', { has: page.getByRole('heading', { name: 'Shares an area with' }) });
    const links = related.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
    for (const href of await links.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute('href') ?? ''),
    )) {
      expect(href).toMatch(/^\/products\/[a-z-]+$/);
    }
  });

  test('navigating from a product page back into the site works', async ({ page }) => {
    await page.goto('/products/sdk', { waitUntil: 'load' });
    // The navigation's section links are root-relative. From a product page a
    // bare #ecosystem would resolve against this document, where no such section
    // exists — which is exactly the bug the prerender assertion now checks.
    await page.locator('header').getByRole('link', { name: 'Ecosystem' }).click();
    await page.waitForURL(/#ecosystem$/);
    await expect(page.locator('#ecosystem')).toBeInViewport();

    await page.getByRole('link', { name: 'Back to the homepage' }).first().isVisible().catch(() => undefined);
  });

  test('the products panel opens from a product page and links to its siblings', async ({ page }) => {
    await page.goto('/products/sdk', { waitUntil: 'load' });
    const trigger = page.getByRole('button', { name: /Products/ });
    await trigger.click();
    await page.waitForTimeout(250);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = page.locator('header [data-state="open"]');
    await expect(panel.getByRole('link', { name: /Hilbras OS/ })).toHaveAttribute('href', '/products/os');
  });
});

test.describe('the product index', () => {
  test('lists every product exactly once', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'load' });

    const cards = page.locator('main a[href^="/products/"]');
    const hrefs = await cards.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href') ?? ''));

    // A product in two areas used to appear under both, so the page announced
    // eleven products and showed sixteen entries. Set equality catches that
    // class of bug in both directions: a product missing from the page, and an
    // entry on the page that is not a product.
    const linked = new Set(hrefs);
    expect([...linked].filter((href) => !PRODUCT_PATHS.has(href))).toEqual([]);
    expect([...PRODUCT_PATHS].filter((path) => !linked.has(path))).toEqual([]);
    expect(hrefs).toHaveLength(PRODUCT_PATHS.size);

    for (const [, name] of PRODUCTS) {
      await expect(page.getByRole('link', { name: new RegExp(name) }).first()).toBeVisible();
    }
  });

  test('states how many products there are, and the number matches', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'load' });
    // Polled rather than read once: the lede is a scroll reveal with a 580ms
    // transition, so a fixed short wait can catch it mid-fade.
    // Built from the same numbers the page is built from, so this can only fail
    // if the page and the registry disagree — which is the thing worth checking.
    await expect(
      page.getByText(`${counts.products} products across ${counts.areas} technology areas`),
    ).toBeVisible();
  });

  test('names every area', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'load' });
    for (const area of AREA_NAMES) {
      await expect(page.getByRole('heading', { level: 2, name: area, exact: true })).toBeVisible();
    }
  });
});

test.describe('the 404 page', () => {
  test('serves a real 404 with a way back', async ({ page }) => {
    const response = await page.goto('/products/ghostware', { waitUntil: 'load' });
    expect(response?.status(), 'an unknown path must not be served as 200').toBe(404);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing here.');
    await expect(page.getByRole('link', { name: /Back to the homepage/ })).toHaveAttribute('href', '/');
  });

  test('offers every product, since a stale product link is the likeliest reason', async ({ page }) => {
    await page.goto('/nope', { waitUntil: 'load' });
    for (const [slug, name] of PRODUCTS) {
      await expect(page.locator('main').getByRole('link', { name, exact: true })).toHaveAttribute(
        'href',
        `/products/${slug}`,
      );
    }
  });

  test('is marked noindex so it is never indexed as content', async ({ page }) => {
    const response = await page.goto('/404.html', { waitUntil: 'load' });
    const robots = await response?.text();
    expect(robots).toContain('noindex');
  });
});

test.describe('the homepage is unchanged', () => {
  test('still carries the full company page', async ({ page }) => {
    await gotoHome(page);
    for (const id of ['ecosystem', 'products', 'connect', 'technology', 'vision']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    // The roadmap's constraint: the homepage represents the company, and
    // detailed product information moved to the product pages rather than
    // piling up here.
    // Every product, from the registry rather than a remembered number. The
    // homepage grid shows all of them; `featured` only decides which get a wide
    // card on the index.
    await expect(page.locator('#products article')).toHaveCount(products.length);
    expect(counts.featured).toBeLessThanOrEqual(products.length);
  });
});
