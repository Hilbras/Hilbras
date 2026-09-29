import { areas, products, productSchemas, type Product } from './areas';
import { site } from './site';

type JsonNode = Record<string, unknown>;

/**
 * `creativeWorkStatus` only distinguishes published from not, so a beta and a
 * stable product look identical to a crawler. `isAccessibleForFree` and the
 * card's own status pill carry the rest of the signal.
 */
const maturity: Record<string, 'InProgress' | 'Published'> = {
  building: 'InProgress',
  alpha: 'InProgress',
  beta: 'Published',
  stable: 'Published',
};

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
    const schema = productSchemas[product.kind];
    const node: JsonNode = {
      '@type': schema.type,
      '@id': `${site.domain}/#product-${product.id}`,
      name: product.name,
      description: product.description,
      url: product.href ?? `${site.domain}/#products`,
      applicationCategory: schema.category,
      // Maturity, in the vocabulary schema.org actually defines. The longer
      // explanation of what `alpha` promises lives in statusDefinitions and is
      // surfaced on the card, not smuggled into `softwareVersion`.
      creativeWorkStatus: maturity[product.status],
      operatingSystem: product.platform ?? 'Cross-platform',
      provider: { '@id': `${site.domain}/#organization` },
      publisher: { '@id': `${site.domain}/#organization` },
      about: areasFor(product).map((name) => ({ '@type': 'Thing', name })),
    };

    if (product.repository) {
      node.codeRepository = product.repository;
      node.isAccessibleForFree = true;
    }
    if (product.documentation) node.hasPart = { '@type': 'WebPage', url: product.documentation, name: `${product.name} documentation` };
    if (product.featured) node.isAccessibleForFree = true;

    nodes.push(node);
  }

  return nodes;
}

function areasFor(product: Product): string[] {
  return areas.filter((area) => area.products.includes(product.id)).map((area) => area.name);
}

/** The complete document, ready to drop into a `<script type="application/ld+json">`. */
export function buildStructuredDataDocument(): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': buildGraph() });
}
