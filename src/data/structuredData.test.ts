import { describe, expect, it } from 'vitest';
import { products } from './areas';
import { site } from './site';
import { buildGraph, buildStructuredDataDocument } from './structuredData';
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

  it('does not abuse softwareVersion to carry a status sentence', () => {
    for (const node of graph) {
      expect(node.softwareVersion).toBeUndefined();
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
});
