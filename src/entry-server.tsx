import { renderToString } from 'react-dom/server';
import { buildDeveloperList, buildGraph, buildStructuredDataDocument } from './data/structuredData';
import { validateData, formatIssues } from './data/validation';
import { resolveSiteUrl, isDefaultOrigin } from './data/url';
import { areas, productById, products, publishedPackages, sourceOnlyProducts, registryLicence } from './data/areas';
import { counts, site, sentence, spell } from './data/site';
import { App } from './pages/App';
import { allRoutes, productPath, resolveRoute, type Route } from './routes';

/**
 * The server entry for the prerender step.
 *
 * The whole app is server-renderable as it stands: the only browser APIs in play
 * are behind `useEffect`, which never runs on a server. So `vite build --mode ssr`
 * compiles this file, the prerender step calls `render(path)` once per route, and
 * each result is written to its own HTML file.
 *
 * The route table travels with it, derived from the product registry, so a new
 * product produces a page without a second edit.
 *
 * `site` and the structured-data builder travel with it so the prerender step
 * can set every absolute URL and emit the JSON-LD from one source of truth.
 */
export function render(path = '/'): string {
  return renderToString(<App path={path} />);
}

/**
 * The JSON-LD for a route, as that route should publish it.
 *
 * The homepage publishes the whole graph. A product page publishes the
 * organisation, the website and its own product — not the other ten, which would
 * be eleven products described on every page and would make each page's
 * structured data assert things about products it is not about.
 */
export function buildRouteStructuredData(route: Route, origin: string): string {
  if (route.kind === 'developers') {
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': buildDeveloperList(origin) });
  }
  if (route.kind !== 'product') return buildStructuredDataDocument(origin);

  const own = `${origin}/#product-${route.id}`;
  const graph = buildGraph(origin).filter(
    (node) => node['@id'] === own || node['@type'] === 'Organization' || node['@type'] === 'WebSite',
  );

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

export {
  site,
  areas,
  productById,
  products,
  publishedPackages,
  sourceOnlyProducts,
  registryLicence,
  counts,
  spell,
  sentence,
  buildStructuredDataDocument,
  buildGraph,
  validateData,
  formatIssues,
  resolveSiteUrl,
  isDefaultOrigin,
  allRoutes,
  productPath,
  resolveRoute,
};
export type { Route };
