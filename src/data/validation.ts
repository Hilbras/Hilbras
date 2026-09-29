import { areas, products, productsInArea, productSchemas, statusOrder, statusDefinitions, statusLabels, type Product } from './areas';
import { PRODUCTS_ANCHOR, isExternalHref } from './links';
import { audiences, footerGroups, navLinks, principles, vision } from './site';

export type Issue = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
};

const GITHUB_REPOSITORY = /^https:\/\/github\.com\/Hilbras\/[A-Za-z0-9._-]+$/;

/**
 * Checks the data layer for the ways it can quietly go wrong.
 *
 * Every product and area on this site is one object in one file, and six
 * components, the structured data, the navigation, the footer, and the sitemap
 * all derive from it. That is the right design and it has one failure mode: a
 * typo publishes a broken link or a duplicate id and nothing complains. This
 * runs in the build, so those become a failed build rather than a live defect.
 */
export function validateData(): Issue[] {
  const issues: Issue[] = [];
  const error = (code: string, message: string) => issues.push({ severity: 'error', code, message });
  const warn = (code: string, message: string) => issues.push({ severity: 'warning', code, message });

  // --- Products ---------------------------------------------------------
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const product of products) {
    const where = `product "${product.id}"`;

    if (seenIds.has(product.id)) error('duplicate-product-id', `Duplicate product id "${product.id}".`);
    seenIds.add(product.id);

    if (seenNames.has(product.name)) error('duplicate-product-name', `Duplicate product name "${product.name}".`);
    seenNames.add(product.name);

    if (!/^[a-z][a-z0-9-]*$/.test(product.id)) {
      error('invalid-product-id', `${where}: id must be lower-case kebab-case, since it is used as a URL fragment.`);
    }

    if (!areas.some((area) => area.id === product.area)) {
      error('invalid-area-reference', `${where}: area "${product.area}" is not a known area.`);
    }

    if (!statusLabels[product.status]) {
      error('missing-status', `${where}: status "${product.status}" is not one of ${statusOrder.join(', ')}.`);
    }
    if (!statusDefinitions[product.status]) {
      error('missing-status-definition', `${where}: no definition for status "${product.status}".`);
    }

    if (!productSchemas[product.kind]) {
      error('unknown-kind', `${where}: kind "${product.kind}" has no schema mapping.`);
    }

    if (!product.description?.trim()) error('missing-description', `${where}: description is empty.`);
    if (!product.summary?.trim()) error('missing-summary', `${where}: summary is empty.`);
    if (product.description === product.summary) {
      warn('redundant-summary', `${where}: summary is identical to the description.`);
    }

    if (product.repository && !GITHUB_REPOSITORY.test(product.repository)) {
      error('invalid-repository-url', `${where}: repository must be a github.com/Hilbras URL, got "${product.repository}".`);
    }
    if (product.href && !isExternalHref(product.href)) {
      error('invalid-product-url', `${where}: href must be absolute, got "${product.href}".`);
    }
    if (product.documentation && !isExternalHref(product.documentation)) {
      error('invalid-documentation-url', `${where}: documentation must be absolute, got "${product.documentation}".`);
    }

    // A product with nothing public gets an honest card. A product that has a
    // repository but claims no status is a data-entry slip, not a judgement.
    if (!product.href && !product.repository && product.status === 'stable') {
      error('stable-without-release', `${where}: marked stable but has neither a site nor a repository.`);
    }
    if (product.status === 'building' && (product.href || product.repository)) {
      warn('building-with-links', `${where}: marked in development but is already linked publicly.`);
    }
  }

  const featured = products.filter((product) => product.featured);
  if (featured.length === 0) error('no-featured-products', 'No product is marked featured.');
  if (featured.length > products.length / 2) {
    warn('too-many-featured', `${featured.length} of ${products.length} products are featured, which stops the grid distinguishing them.`);
  }

  // --- Areas ------------------------------------------------------------
  const seenAreaIds = new Set<string>();
  for (const area of areas) {
    if (seenAreaIds.has(area.id)) error('duplicate-area-id', `Duplicate area id "${area.id}".`);
    seenAreaIds.add(area.id);

    if (area.products.length === 0) warn('empty-area', `Area "${area.id}" lists no products.`);

    for (const id of area.products) {
      if (!products.some((product) => product.id === id)) {
        error('dangling-area-reference', `Area "${area.id}" lists product "${id}", which does not exist.`);
      }
    }
  }

  // Every product must be discoverable somewhere. A product that exists in the
  // data but is in no area renders in the product grid and nowhere else.
  for (const product of products) {
    if (!areas.some((area) => area.products.includes(product.id))) {
      error('orphan-product', `Product "${product.id}" belongs to no area, so the ecosystem and connection map omit it.`);
    }
  }

  // --- Copy the rest of the site reads -----------------------------------
  if (audiences.length === 0) error('no-audiences', 'No audiences defined.');
  for (const audience of audiences) {
    if (!audience.cta.href.startsWith('#')) {
      error('invalid-audience-cta', `Audience "${audience.id}": cta must be an on-page anchor.`);
    }
  }
  if (principles.length === 0) error('no-principles', 'No principles defined.');
  if (vision.stages.length === 0) error('no-vision-stages', 'No vision stages defined.');

  // --- Internal links must resolve --------------------------------------
  // Checked against the section ids the page actually renders.
  const sectionIds = new Set([
    'main', 'about', 'ecosystem', 'products', 'connect', 'technology', 'built-for', 'philosophy', 'vision', 'start',
  ]);
  for (const link of [...navLinks, ...footerGroups.flatMap((group) => group.links)]) {
    if (link.href.startsWith('#') && link.href !== PRODUCTS_ANCHOR && !sectionIds.has(link.href.slice(1))) {
      error('dead-internal-link', `Navigation link "${link.href}" (${link.label}) has no matching section id.`);
    }
    if (link.href === PRODUCTS_ANCHOR && !sectionIds.has('products')) {
      error('dead-internal-link', 'Navigation links to the products anchor, which does not exist.');
    }
  }

  return issues;
}

/** The validation as a formatted report, for a human reading build output. */
export function formatIssues(issues: Issue[]): string {
  return issues
    .map((issue) => `  ${issue.severity === 'error' ? 'error' : 'warn '} [${issue.code}] ${issue.message}`)
    .join('\n');
}

export { products, areas, productsInArea, type Product };
