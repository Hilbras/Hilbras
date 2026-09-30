import { areas, products, productsInArea, productSchemas, statusOrder, statusDefinitions, statusLabels, type Product } from './areas';
import { isExternalHref } from './links';
import { markIds } from './marks';
import { connectionStages, stageIds } from './stages';
import { audiences, footerGroups, navLinks, principles, vision } from './site';
import { allRoutes } from '../routes';

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

    // Both of these used to be enforced by a component rather than by the data,
    // which meant a product could be published while silently missing from the
    // diagram, and a mark that did not exist compiled fine and rendered an empty
    // box. `tsc` rejects a product naming a mark or band nobody drew, but
    // `build:server` is esbuild and does no type checking at all — so this is
    // the only thing standing between a cast and a live page with a blank tile.
    if (!stageIds.includes(product.stage)) {
      error('invalid-stage-reference', `${where}: stage "${product.stage}" is not a known band. Known: ${stageIds.join(', ')}.`);
    }
    if (!markIds.includes(product.mark)) {
      error('invalid-mark-reference', `${where}: mark "${product.mark}" is not in src/data/marks.ts.`);
    }

    // Two products sharing a mark is a claim they are the same thing. Areas may
    // reuse a product's mark deliberately — Security uses the shield that
    // Spectra draws — so this is only about products.
    const sharing = products.filter((other) => other.mark === product.mark);
    if (sharing.length > 1) {
      error(
        'duplicate-product-mark',
        `${where}: mark "${product.mark}" is also used by ${sharing.filter((other) => other.id !== product.id).map((other) => other.id).join(', ')}. Each product needs its own mark.`,
      );
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

    // Developer metadata is copied from a registry and a README, so it can go
    // stale or be mistyped. A package name that is not a valid npm name, or an
    // install command for a different package than the one named, is a small lie
    // on the page and in the structured data.
    if (product.developer) {
      const { package: name, version, install, license: licence, verified } = product.developer;

      if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
        error('invalid-package-name', `${where}: "${name}" is not a valid npm package name.`);
      }
      if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
        error('invalid-package-version', `${where}: "${version}" is not a semantic version.`);
      }
      if (!install.includes(name)) {
        error('install-command-mismatch', `${where}: the install command does not mention "${name}".`);
      }
      if (!/^[A-Za-z0-9.-]+$/.test(licence)) {
        error('invalid-license', `${where}: "${licence}" is not an SPDX identifier.`);
      }
      // A version quoted without a date is a version nobody checked.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(verified) || Number.isNaN(Date.parse(verified))) {
        error('missing-verification-date', `${where}: developer.verified must be an ISO date.`);
      }
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

  // An unused band or an undrawn mark is not an error — the data may legitimately
  // be ahead of a product — but it is worth seeing, because both usually mean a
  // product was renamed or removed and something was left behind.
  for (const stage of connectionStages) {
    if (!products.some((product) => product.stage === stage.id)) {
      warn('empty-stage', `No product is in the "${stage.id}" band, so it renders empty.`);
    }
  }
  for (const mark of markIds) {
    if (!products.some((product) => product.mark === mark)) {
      warn('unused-mark', `No product uses the "${mark}" mark.`);
    }
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
    // Root-relative for the same reason as the navigation links: these are
    // followed from the product pages as well as the homepage.
    if (!audience.cta.href.startsWith('/#')) {
      error('invalid-audience-cta', `Audience "${audience.id}": cta must be a root-relative anchor such as /#ecosystem.`);
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
    // Section links are written root-relative, as `/#ecosystem`, because they
    // are followed from the product pages too and a bare `#ecosystem` resolves
    // against whatever page the reader is on. On the homepage it is still a
    // same-document navigation, so nothing is lost.
    //
    // External links are not section links.
    if (isExternalHref(link.href)) continue;

    // `#main` is the one exception and is deliberately not root-relative: every
    // page has a `main`, so the skip link must stay on the current document.
    if (link.href === '#main') continue;

    // Two kinds of internal link, and they have different rules.
    //
    // A *section* link points into the homepage's anchors. It is written
    // root-relative as `/#ecosystem`, because it is followed from the product
    // pages too and a bare `#ecosystem` resolves against whatever page the
    // reader happens to be on. On the homepage it is still same-document
    // navigation, so nothing is lost.
    if (link.href.startsWith('/#')) {
      const anchor = link.href.slice(2);
      if (!sectionIds.has(anchor)) {
        error('dead-internal-link', `Navigation link "${link.href}" (${link.label}) has no matching section id.`);
      }
      continue;
    }

    // A *page* link — `/developers` — is a document in its own right, so it has
    // to resolve to a route rather than to an anchor. This used to be checked as
    // if every navigation link were a section link, which is why adding a page
    // to the navigation failed the build with "has no matching section id" —
    // a true-sounding complaint about a link that was pointing at a real page.
    const path = link.href.split('#')[0].replace(/\/$/, '') || '/';
    if (!allRoutes().some((route) => route.path === path)) {
      error('dead-internal-link', `Navigation link "${link.href}" (${link.label}) is not a route.`);
    }
    if (link.href.includes('#')) {
      error('non-absolute-section-link', `Navigation link "${link.href}" (${link.label}) mixes a page and a fragment, which resolves against the current page.`);
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
