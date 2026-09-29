import { areas, products } from './areas';
import { site } from './site';

type JsonNode = Record<string, unknown>;

/**
 * The organisation, the website, and one node per product.
 *
 * Built from the same data the page renders, so the structured data and the
 * visible copy cannot drift apart. Returns a bare array: the `@graph` wrapper
 * and the `@context` are added by whoever serialises it.
 */
export function buildGraph(): JsonNode[] {
  const organisation: JsonNode = {
    '@type': 'Organization',
    '@id': `${site.domain}/#organization`,
    name: site.name,
    url: site.domain,
    slogan: site.tagline,
    description: site.description,
    foundingDate: site.organisation.founding,
    sameAs: [site.organisation.github],
  };

  const nodes: JsonNode[] = [
    organisation,
    {
      '@type': 'WebSite',
      '@id': `${site.domain}/#website`,
      url: site.domain,
      name: site.name,
      description: site.description,
      inLanguage: 'en',
      publisher: { '@id': `${site.domain}/#organization` },
    },
  ];

  for (const product of products) {
    const node: JsonNode = {
      '@type': 'SoftwareApplication',
      '@id': `${site.domain}/#product-${product.id}`,
      name: product.name,
      description: product.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
      url: product.href ?? `${site.domain}/#products`,
      provider: { '@id': `${site.domain}/#organization` },
      about: areas
        .filter((area) => area.products.includes(product.id))
        .map((area) => ({ '@type': 'Thing', name: area.name })),
    };
    if (product.repository) node.codeRepository = product.repository;
    nodes.push(node);
  }

  return nodes;
}

/** The complete document, ready to drop into a `<script type="application/ld+json">`. */
export function buildStructuredDataDocument(): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': buildGraph() });
}
