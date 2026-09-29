import { describe, expect, it } from 'vitest';
import {
  areas,
  productById,
  products,
  productsInArea,
  productSchemas,
  statusDefinitions,
  statusOrder,
} from './areas';
import { PRODUCTS_ANCHOR, externalRel, isExternalHref, productHref } from './links';

describe('product data', () => {
  it('gives every product a unique id and name', () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
    expect(new Set(products.map((p) => p.name)).size).toBe(products.length);
  });

  it('uses ids that are safe as URL fragments', () => {
    for (const product of products) {
      expect(product.id, product.name).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('points every product at an area that exists', () => {
    const known = new Set(areas.map((a) => a.id));
    for (const product of products) {
      expect(known.has(product.area), `${product.id} -> ${product.area}`).toBe(true);
    }
  });

  it('places every product in at least one area', () => {
    for (const product of products) {
      const memberships = areas.filter((a) => a.products.includes(product.id));
      expect(memberships.length, `${product.id} is in no area`).toBeGreaterThan(0);
    }
  });

  it('has no area referencing a product that does not exist', () => {
    const ids = new Set(products.map((p) => p.id));
    for (const area of areas) {
      for (const id of area.products) {
        expect(ids.has(id), `${area.id} references ${id}`).toBe(true);
      }
    }
  });

  it('has a schema mapping and a definition for every kind and status in use', () => {
    for (const product of products) {
      expect(productSchemas[product.kind], `${product.id} kind`).toBeDefined();
      expect(statusDefinitions[product.status], `${product.id} status`).toBeDefined();
    }
  });

  it('keeps repository URLs inside the Hilbras organisation', () => {
    for (const product of products) {
      if (!product.repository) continue;
      expect(product.repository, product.id).toMatch(/^https:\/\/github\.com\/Hilbras\/[\w.-]+$/);
    }
  });

  it('only marks a product stable if something is publicly released', () => {
    for (const product of products) {
      if (product.status !== 'stable') continue;
      expect(product.href ?? product.repository, `${product.id} claims stable`).toBeTruthy();
    }
  });

  it('marks at least one product featured and fewer than half', () => {
    const featured = products.filter((p) => p.featured);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThan(products.length / 2);
  });
});

describe('status semantics', () => {
  it('defines a label and a definition for each of the four levels', () => {
    expect(statusOrder).toEqual(['building', 'alpha', 'beta', 'stable']);
    for (const status of statusOrder) {
      expect(statusDefinitions[status].length).toBeGreaterThan(20);
    }
  });

  it('never describes an unfinished product as a supported release', () => {
    expect(statusDefinitions.building).toMatch(/nothing here is a supported release/i);
    expect(statusDefinitions.alpha).toMatch(/still changing/i);
  });
});

describe('link helpers', () => {
  it('falls back to the products anchor when a product has no site', () => {
    expect(productHref({ href: undefined })).toBe(PRODUCTS_ANCHOR);
    expect(productHref({ href: 'https://example.dev' })).toBe('https://example.dev');
  });

  it('recognises external links and leaves internal ones alone', () => {
    expect(isExternalHref('https://github.com/Hilbras')).toBe(true);
    expect(isExternalHref('http://example.com')).toBe(true);
    expect(isExternalHref('#products')).toBe(false);
    expect(isExternalHref('/products/sdk')).toBe(false);
    expect(isExternalHref('mailto:a@b.c')).toBe(false);
  });

  it('adds a safe rel only to external links', () => {
    expect(externalRel('https://example.com')).toBe('noreferrer noopener');
    expect(externalRel('#products')).toBeUndefined();
  });
});

describe('area mapping', () => {
  it('returns nothing for an unknown area rather than throwing', () => {
    expect(productsInArea('not-an-area' as never)).toEqual([]);
  });

  it('returns the products an area lists, in the order it lists them', () => {
    const ai = areas.find((a) => a.id === 'ai');
    expect(productsInArea('ai').map((p) => p.id)).toEqual(ai?.products);
  });

  it('resolves a product by id', () => {
    expect(productById.get('sdk')?.name).toBe('Hilbras SDK');
    expect(productById.get('nope')).toBeUndefined();
    expect(productById.size).toBe(products.length);
  });
});
