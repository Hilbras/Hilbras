import { areas, products, productSchemas, publishedPackages, type Product } from './areas';
import { productPath } from '../routes';
import { site } from './site';
import { resolveSiteUrl } from './url';

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
export function buildGraph(origin: string = resolveSiteUrl()): JsonNode[] {
  const organisation: JsonNode = {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: site.name,
    url: origin,
    slogan: site.tagline,
    description: site.description,
    foundingDate: site.organisation.founding,
    sameAs: [site.organisation.github],
  };

  const nodes: JsonNode[] = [
    organisation,
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: origin,
      name: site.name,
      description: site.description,
      inLanguage: 'en',
      publisher: { '@id': `${origin}/#organization` },
    },
  ];

  for (const product of products) {
    const schema = productSchemas[product.kind];
    const node: JsonNode = {
      '@type': schema.type,
      '@id': `${origin}/#product-${product.id}`,
      name: product.name,
      description: product.description,
      url: product.href ?? `${origin}/#products`,
      applicationCategory: schema.category,
      // Maturity, in the vocabulary schema.org actually defines. The longer
      // explanation of what `alpha` promises lives in statusDefinitions and is
      // surfaced on the card, not smuggled into `softwareVersion`.
      creativeWorkStatus: maturity[product.status],
      provider: { '@id': `${origin}/#organization` },
      publisher: { '@id': `${origin}/#organization` },
      about: areasFor(product).map((name) => ({ '@type': 'Thing', name })),
    };

    // Only when it is informative.
    //
    // "Cross-platform" used to be emitted for every product, which made the
    // property worthless: a crawler learns nothing from a value that is true of
    // essentially everything, and it drowns out the one product where the answer
    // is specific. Hilbras OS is Ubuntu-based and says Linux; the rest omit it
    // rather than assert the obvious.
    if (product.platform) node.operatingSystem = product.platform;

    // A real version, and the licence it ships under.
    //
    // This property used to carry a status sentence, which was a misuse of it. It
    // is only correct when it is a version, so it appears only for the products
    // that are actually published to a registry — and for those it is the
    // authoritative answer rather than a claim.
    if (product.developer) {
      node.softwareVersion = product.developer.version;
      node.license = `https://spdx.org/licenses/${product.developer.license}`;
    }

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

/**
 * The complete document, ready to drop into a `<script type="application/ld+json">`.
 *
 * The origin is a parameter so a caller can build a preview's structured data
 * against the preview's own domain rather than the committed one. It defaults to
 * the resolved build origin, which is `SITE_URL` when set.
 */
export function buildStructuredDataDocument(origin: string = resolveSiteUrl()): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': buildGraph(origin) });
}

/**
 * The developer page's graph: the organisation, the website, the collection
 * page itself, and an `ItemList` of the published packages.
 *
 * Each package reuses the `@id` its product page publishes, so a crawler that
 * has seen both pages is looking at the same entity rather than two descriptions
 * of it. The `@id`s are the join; inventing page-local ones would silently fork
 * the entity.
 *
 * Only packages that are actually published appear. Listing a product with no
 * registry entry in a list of things to install would be a claim the data does
 * not support — and the version and licence are the registry's own answers, not
 * a summary someone wrote.
 */
export function buildDeveloperList(origin: string = resolveSiteUrl()): JsonNode[] {
  const page: JsonNode = {
    '@type': 'CollectionPage',
    '@id': `${origin}/developers`,
    url: `${origin}/developers`,
    name: `For developers — ${site.name}`,
    description: site.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${origin}/#website` },
  };

  const items: JsonNode[] = publishedPackages.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'SoftwareSourceCode',
      '@id': `${origin}/#product-${product.id}`,
      name: product.name,
      description: product.description,
      softwareVersion: product.developer!.version,
      license: `https://spdx.org/licenses/${product.developer!.license}`,
      codeRepository: product.repository,
      url: `${origin}${productPath(product.id)}`,
      maintainer: { '@id': `${origin}/#organization` },
    },
  }));

  const list: JsonNode = {
    '@type': 'ItemList',
    '@id': `${origin}/developers#packages`,
    name: 'Published Hilbras packages',
    numberOfItems: items.length,
    itemListElement: items,
  };

  page.mainEntity = list;

  return [
    ...buildGraph(origin).filter((node) => node['@type'] === 'Organization' || node['@type'] === 'WebSite'),
    page,
    list,
  ];
}
