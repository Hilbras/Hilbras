import { describe, expect, it } from 'vitest';
import { products, publishedPackages } from './areas';
import { site } from './site';
import { buildDeveloperList, buildGraph, buildStructuredDataDocument } from './structuredData';
import { validateData } from './validation';

describe('structured data', () => {
  const graph = buildGraph();
  const organisation = graph.find((n) => n['@type'] === 'Organization');
  const website = graph.find((n) => n['@type'] === 'WebSite');
  const productNodes = graph.filter((n) => !['Organization', 'WebSite'].includes(String(n['@type'])));

  it('publishes one organisation and one website', () => {
    expect(organisation).toBeDefined();
    expect(website).toBeDefined();
    expect(graph.filter((n) => n['@type'] === 'Organization')).toHaveLength(1);
  });

  it('publishes a node per product', () => {
    expect(productNodes).toHaveLength(products.length);
    expect(productNodes.map((n) => n['@id']).sort()).toEqual(
      products.map((p) => `${site.domain}/#product-${p.id}`).sort(),
    );
  });

  it('builds every identifier from the configured domain', () => {
    expect(organisation?.url).toBe(site.domain);
    expect(website?.url).toBe(site.domain);
    for (const node of productNodes) {
      expect(String(node['@id']).startsWith(site.domain)).toBe(true);
    }
  });

  it('points each product at its own site, or back at the products section', () => {
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const node of productNodes) {
      const id = String(node['@id']).split('#product-')[1];
      const product = byId.get(id);
      expect(node.url, id).toBe(product?.href ?? `${site.domain}/#products`);
    }
  });

  it('types each product by what it is rather than as a developer application', () => {
    const types = new Map(products.map((p) => [p.id, p.kind]));
    for (const node of productNodes) {
      const id = String(node['@id']).split('#product-')[1];
      const kind = types.get(id);
      expect(node['@type'], `${id} is a ${kind}`).toBe(
        kind === 'library' ? 'SoftwareSourceCode'
        : kind === 'system' ? 'OperatingSystem'
        : 'SoftwareApplication',
      );
    }
  });

  it('publishes an operating system only where it is informative', () => {
    const os = productNodes.find((n) => n['@type'] === 'OperatingSystem');
    expect(os).toBeDefined();
    expect(os?.operatingSystem).toBe('Linux');

    // "Cross-platform" used to be on every node, which is a value that tells a
    // crawler nothing. The property is now emitted only where it differs.
    const declared = productNodes.filter((n) => n.operatingSystem !== undefined);
    expect(declared.map((n) => n.operatingSystem)).toEqual(['Linux']);
  });

  it('never publishes the string "Cross-platform" as an operating system', () => {
    for (const node of productNodes) {
      expect(node.operatingSystem, String(node.name)).not.toBe('Cross-platform');
    }
  });

  it('publishes an operating system for exactly the products that declare one', () => {
    const declaring = new Set(products.filter((p) => p.platform).map((p) => p.name));
    for (const node of productNodes) {
      if (declaring.has(String(node.name))) expect(node.operatingSystem, String(node.name)).toBeTruthy();
      else expect(node, `${node.name} declares no platform`).not.toHaveProperty('operatingSystem');
    }
  });

  it('publishes softwareVersion only where it really is a version', () => {
    // The property used to carry a status sentence, which was a misuse. It is
    // correct when it is a version, so it appears only for the products actually
    // published to a registry — and then it is the authoritative answer.
    const published = products.filter((product) => product.developer);
    expect(published.length).toBeGreaterThan(0);

    for (const node of graph) {
      if (node.softwareVersion === undefined) continue;
      expect(String(node.softwareVersion)).toMatch(/^\d+\.\d+\.\d+/);
    }

    for (const product of products) {
      const node = productNodes.find((n) => n['@id'] === `${site.domain}/#product-${product.id}`);
      if (product.developer) {
        expect(node?.softwareVersion, product.id).toBe(product.developer.version);
        expect(node?.license, product.id).toContain(product.developer.license);
      } else {
        expect(node?.softwareVersion, `${product.id} is not published`).toBeUndefined();
        expect(node?.license, `${product.id} is not published`).toBeUndefined();
      }
    }
  });

  it('never puts a status sentence in softwareVersion', () => {
    for (const node of graph) {
      if (node.softwareVersion === undefined) continue;
      expect(String(node.softwareVersion)).not.toMatch(/publicly released|still changing|under active/i);
    }
  });

  it('marks a product still in development as in progress', () => {
    for (const product of products) {
      const node = productNodes.find((n) => n['@id'] === `${site.domain}/#product-${product.id}`);
      expect(node?.creativeWorkStatus, product.id).toBe(
        product.status === 'building' || product.status === 'alpha' ? 'InProgress' : 'Published',
      );
    }
  });

  it('emits valid JSON with a context and a graph', () => {
    const parsed = JSON.parse(buildStructuredDataDocument());
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@graph']).toHaveLength(graph.length);
  });

  it('escapes nothing that could break out of the script element', () => {
    const document = buildStructuredDataDocument();
    expect(document).not.toContain('</script');
    expect(document).not.toContain('<!--');
  });
});

describe('validation', () => {
  it('reports the current data as consistent', () => {
    const errors = validateData().filter((issue) => issue.severity === 'error');
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  it('reports no warnings on the current data either', () => {
    const warnings = validateData().filter((issue) => issue.severity === 'warning');
    expect(warnings, JSON.stringify(warnings, null, 2)).toEqual([]);
  });
});

describe('site configuration', () => {
  it('has an absolute, protocol-qualified domain with no trailing slash', () => {
    expect(site.domain).toMatch(/^https:\/\//);
    expect(site.domain.endsWith('/')).toBe(false);
  });

  it('has a description and a tagline, since both are published', () => {
    expect(site.description.length).toBeGreaterThan(60);
    expect(site.tagline.length).toBeGreaterThan(10);
  });

// The developer page's graph. Its whole value is that it is derived: every node
// comes from `product.developer`, so a package cannot be installable on its own
// page and absent here.
describe('the developer list', () => {
  const origin = 'https://hilbras.example';
  const graph = buildDeveloperList(origin);
  const list = graph.find((n) => n['@type'] === 'ItemList')!;
  const page = graph.find((n) => n['@type'] === 'CollectionPage')!;
  const entries = list.itemListElement as { position: number; item: Record<string, unknown> }[];

  it('describes the page and the organisation it belongs to', () => {
    expect(page['@id']).toBe(`${origin}/developers`);
    expect(page.url).toBe(`${origin}/developers`);
    expect(page.isPartOf).toEqual({ '@id': `${origin}/#website` });
    expect(graph.some((n) => n['@type'] === 'Organization')).toBe(true);
    // The whole product graph is not repeated here: a page that is about five
    // packages should not assert things about the six that have none.
    expect(graph.filter((n) => String(n['@type']).startsWith('Software'))).toHaveLength(0);
  });

  it('lists exactly the packages that are published', () => {
    expect(list.numberOfItems).toBe(publishedPackages.length);
    expect(entries).toHaveLength(publishedPackages.length);
    expect(entries.map((entry) => entry.position)).toEqual(
      publishedPackages.map((_, index) => index + 1),
    );
  });

  it('gives every entry the registry\'s own answers, and the product\'s identity', () => {
    for (const [index, entry] of entries.entries()) {
      const product = publishedPackages[index];
      const developer = product.developer!;
      // The same @id the product page publishes, so a crawler that has seen both
      // is looking at one entity rather than two descriptions of it.
      expect(entry.item['@id'], product.id).toBe(`${origin}/#product-${product.id}`);
      expect(entry.item.softwareVersion, product.id).toBe(developer.version);
      expect(entry.item.license, product.id).toBe(`https://spdx.org/licenses/${developer.license}`);
      expect(entry.item.codeRepository, product.id).toBe(product.repository);
      expect(entry.item.url, product.id).toBe(`${origin}/products/${product.id}`);
      expect(entry.item.maintainer, product.id).toEqual({ '@id': `${origin}/#organization` });
    }
  });

  it('never lists a product with no registry package', () => {
    const ids = new Set(entries.map((entry) => String(entry.item['@id'])));
    for (const product of products) {
      if (product.developer) continue;
      expect([...ids].some((id) => id.endsWith(`-${product.id}`)), product.id).toBe(false);
    }
  });
});

});
