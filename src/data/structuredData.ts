import { areas, products, productSchemas, type Product } from "./areas";
import { site } from "./site";

type JsonNode = Record<string, unknown>;

const maturity: Record<string, "InProgress" | "Published"> = {
  building: "InProgress",
  alpha: "InProgress",
  beta: "Published",
  stable: "Published",
};

/**
 * The organisation, the website, and one node per product, built from the same
 * data the page renders, so the structured data and the visible copy cannot
 * drift apart. Returns a bare array: the `@graph` wrapper and `@context` are
 * added by whoever serialises it.
 */
export function buildGraph(origin: string = site.domain): JsonNode[] {
  const organisation: JsonNode = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: site.name,
    url: origin,
    slogan: site.tagline,
    description: site.description,
    foundingDate: site.organisation.founding,
    sameAs: [
      site.organisation.github,
      "https://x.com/lacrous0",
      "https://www.threads.com/@hilbras.ai",
    ],
  };

  const nodes: JsonNode[] = [
    organisation,
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: origin,
      name: site.name,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": `${origin}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${origin}/#home`,
      url: `${origin}/`,
      name: site.searchTitle,
      description: site.searchDescription,
      inLanguage: "en",
      isPartOf: { "@id": `${origin}/#website` },
      about: { "@id": `${origin}/#organization` },
    },
  ];

  for (const product of products) {
    const schema = productSchemas[product.kind];
    const node: JsonNode = {
      "@type": schema.type,
      "@id": `${origin}/#product-${product.id}`,
      name: product.name,
      description: product.description,
      /**
       * The product's own page on this site, not the external site. Every product
       * now has a page at `/products/{id}` — that is where the registry meets the
       * outside world and is the address a crawler should follow. The external
       * `href` is still published as `sameAs`-adjacent information via the
       * product's `url` field only when no page exists; today they all do.
       */
      url: `${origin}/products/${product.id}`,
      applicationCategory: schema.category,
      creativeWorkStatus: maturity[product.status],
      provider: { "@id": `${origin}/#organization` },
      publisher: { "@id": `${origin}/#organization` },
      about: areasFor(product).map((name) => ({ "@type": "Thing", name })),
    };

    if (product.platform) node.operatingSystem = product.platform;

    if (product.developer) {
      node.softwareVersion = product.developer.version;
      node.license = `https://spdx.org/licenses/${product.developer.license}`;
    }

    if (product.repository) {
      node.codeRepository = product.repository;
      node.isAccessibleForFree = true;
    }
    if (product.documentation)
      node.hasPart = {
        "@type": "WebPage",
        url: product.documentation,
        name: `${product.name} documentation`,
      };

    nodes.push(node);
  }

  return nodes;
}

function areasFor(product: Product): string[] {
  return areas.filter((area) => area.products.includes(product.id)).map((area) => area.name);
}

export function buildStructuredDataDocument(origin: string = site.domain): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": buildGraph(origin) });
}

/**
 * The two extra nodes a single product page publishes alongside the shared
 * graph: a `BreadcrumbList` (Home → area → product) and the page's own
 * `WebPage` node, joined to the product's `@id` so a crawler that has seen
 * both the home graph and this page is looking at one entity rather than two
 * descriptions of it.
 */
export function buildProductPageNodes(product: Product, origin: string = site.domain): JsonNode[] {
  const area = areas.find((entry) => entry.products.includes(product.id));
  const breadcrumbId = `${origin}/products/${product.id}#breadcrumb`;

  const breadcrumb: JsonNode = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: site.name, item: `${origin}/` },
      ...(area
        ? [{ "@type": "ListItem", position: 2, name: area.name, item: `${origin}/#ecosystem` }]
        : []),
      {
        "@type": "ListItem",
        position: area ? 3 : 2,
        name: product.name,
        item: `${origin}/products/${product.id}`,
      },
    ],
  };

  const webPage: JsonNode = {
    "@type": "WebPage",
    "@id": `${origin}/products/${product.id}#page`,
    url: `${origin}/products/${product.id}`,
    name: `${product.name} — ${site.name}`,
    description: product.page?.metaDescription ?? product.summary,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#product-${product.id}` },
    breadcrumb: { "@id": breadcrumbId },
  };

  return [breadcrumb, webPage];
}
