import { areas, products } from '../data/areas';
import { site } from '../data/site';

type JsonNode = Record<string, unknown>;

/**
 * One organisation node plus one node per product, derived from the same data the
 * page renders. Structured data and visible copy cannot drift apart.
 */
function buildGraph(): JsonNode[] {
  const organisation: JsonNode = {
    '@type': 'Organization',
    '@id': `${site.domain}/#organization`,
    name: site.name,
    url: site.domain,
    slogan: site.tagline,
    description: site.description,
    foundingDate: site.organisation.founding,
    email: site.organisation.email,
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

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // The payload is built from typed, in-repo data — there is no user input
      // in it, and JSON.stringify escapes the characters that could break out.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildGraph()) }}
    />
  );
}
