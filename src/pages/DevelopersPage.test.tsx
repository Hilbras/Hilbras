import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { App } from './App';
import { DevelopersPage } from './DevelopersPage';
import { publishedPackages, products, registryLicence, registryRead, sourceOnlyProducts } from '../data/areas';
import { footerGroups, navLinks } from '../data/site';
import { DEVELOPERS_PATH, resolveRoute } from '../routes';

/**
 * The developer page, and the data views it renders.
 *
 * The point of these tests is that the page holds no list of its own. Every
 * package on it comes from `product.developer`, so the failure this guards
 * against is a package that is installable on its product page and missing from
 * the index of installable things — the failure that only shows up once
 * somebody publishes something.
 */
describe('the developer page', () => {
  it('is a route, and resolves like one', () => {
    expect(resolveRoute(DEVELOPERS_PATH)).toEqual({ kind: 'developers', path: DEVELOPERS_PATH });
    expect(resolveRoute('/developers/')).toEqual(resolveRoute(DEVELOPERS_PATH));
  });

  it('lists every published package, and nothing else', () => {
    render(<DevelopersPage />);
    const section = screen.getByRole('region', { name: 'Published packages' });

    for (const product of publishedPackages) {
      const developer = product.developer!;
      expect(within(section).getByText(developer.package), product.id).toBeInTheDocument();
      expect(within(section).getByText(`v${developer.version} · ${developer.license}`), product.id).toBeInTheDocument();
      expect(within(section).getByText(developer.install), product.id).toBeInTheDocument();
    }

    // The section must not describe a product with nothing published.
    for (const product of sourceOnlyProducts) {
      expect(within(section).queryByText(product.name), product.id).not.toBeInTheDocument();
    }
  });

  it('dates the versions it quotes, from the data', () => {
    // A registry version goes out of date, and a page quoting an old one without
    // saying when is a small lie. Stated once for the list rather than five
    // times under five cards — five identical dates is noise, and the question a
    // reader has is "how stale is this?", which one date answers.
    expect(registryRead).not.toBeNull();
    render(<DevelopersPage />);
    expect(screen.getByText(new RegExp(`registry on ${registryRead!.earliest}`))).toBeInTheDocument();
  });

  it('reports the reading range when the packages were not read on one day', () => {
    // If two versions were read on different days, claiming one date for both
    // would be a claim the data does not support.
    const dates = new Set(publishedPackages.map((product) => product.developer!.verified));
    expect(registryRead!.uniform).toBe(dates.size === 1);
    expect(registryRead!.earliest).toBe([...dates].sort()[0]);
  });

  it('states what is not published, rather than leaving it to be discovered', () => {
    render(<DevelopersPage />);
    const section = screen.getByRole('region', { name: 'What is not on a registry' });
    for (const product of sourceOnlyProducts) {
      expect(within(section).getByText(product.name), product.id).toBeInTheDocument();
    }
    // Every product appears on the page exactly once, in one list or the other.
    expect(publishedPackages.length + sourceOnlyProducts.length).toBe(products.length);
  });

  it('gives every h1 one owner and the page one h1', () => {
    render(<DevelopersPage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('the published-package view', () => {
  it('is a view over the registry field, not a list of its own', () => {
    // Every published package is a product, and every product with a `developer`
    // block is in the view. That identity is what makes "add a package" a data
    // edit rather than an edit here too.
    expect(publishedPackages.length).toBe(products.filter((product) => product.developer).length);
    for (const product of publishedPackages) expect(products).toContain(product);
  });

  it('orders packages predictably, so a position never depends on the file', () => {
    const names = publishedPackages.map((product) => product.developer!.package);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('reports a shared licence only when there is one to share', () => {
    // The page says "all MIT". That sentence is derived, so it disappears by
    // itself the day a package is published under something else, rather than
    // the page quietly becoming a lie.
    const licences = new Set(publishedPackages.map((product) => product.developer!.license));
    expect(registryLicence).toBe(licences.size === 1 ? [...licences][0] : null);
    if (licences.size > 1) expect(registryLicence).toBeNull();
  });
});

describe('reaching the developer page', () => {
  it('is linked from the navigation and the footer, and the links resolve', () => {
    const labels = [...navLinks, ...footerGroups.flatMap((group) => group.links)];
    const links = labels.filter((link) => link.href === DEVELOPERS_PATH);
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(resolveRoute(link.href), link.label).toMatchObject({ kind: 'developers' });
    }
  });

  it('is reachable from a product page, where a reader actually lands', () => {
    render(<App path="/products/sdk" />);
    expect(screen.getAllByRole('link', { name: /developers/i }).length).toBeGreaterThan(0);
  });
});
