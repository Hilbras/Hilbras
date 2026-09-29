import { productById, products } from './data/areas';

/**
 * The site's routes.
 *
 * There is no router here, and there does not need to be one. Every route is
 * prerendered to its own HTML file, so a visitor's browser makes an ordinary
 * request for `/products/sdk` and receives a complete document — there is
 * nothing for a client-side router to intercept, and no bundle to download before
 * the page appears. Adding `react-router-dom` would add a dependency and a
 * navigation model to a site that does not navigate on the client.
 *
 * What is left is this resolver, and it is the only place a path becomes a
 * page. Both sides use it: the prerender walks `allRoutes()` to decide what to
 * write to disk, and the client resolves `window.location.pathname` so it
 * hydrates the document that was already served.
 *
 * `allRoutes()` derives from the product registry, so a product added to
 * `areas.ts` gets a page, a sitemap entry and JSON-LD without a second edit.
 */
export type Route =
  | { kind: 'home'; path: string }
  | { kind: 'productIndex'; path: string }
  | { kind: 'product'; path: string; id: string }
  | { kind: 'notFound'; path: string };

export const HOME_PATH = '/';
export const PRODUCTS_PATH = '/products';

const PRODUCT_PATH = /^\/products\/([a-z0-9][a-z0-9-]*)\/?$/;

/** The canonical path for a product, with no trailing slash. */
export function productPath(id: string): string {
  return `${PRODUCTS_PATH}/${id}`;
}

/**
 * Turns a pathname into a route.
 *
 * Only the product's own canonical path resolves. A path that looks like a
 * product but does not exist is `notFound` rather than a redirect or a fallback
 * to the index, so a typo is a 404 and not a page that silently shows the wrong
 * product.
 */
export function resolveRoute(pathname: string): Route {
  // Normalise. A trailing slash and a duplicated slash are both the same
  // document, and preview URLs and shared links disagree about them constantly.
  const withoutQuery = (pathname || HOME_PATH).split('?')[0].split('#')[0];
  const collapsed = withoutQuery.replace(/\/+/g, '/');
  const path = (collapsed.startsWith('/') ? collapsed : `/${collapsed}`).replace(/\/$/, '') || HOME_PATH;

  if (path === HOME_PATH) return { kind: 'home', path: HOME_PATH };
  if (path === PRODUCTS_PATH) return { kind: 'productIndex', path: PRODUCTS_PATH };

  const match = path.match(PRODUCT_PATH);
  if (match) {
    const id = match[1];
    return productById.has(id)
      ? { kind: 'product', path, id }
      : { kind: 'notFound', path };
  }

  return { kind: 'notFound', path };
}

/**
 * Every route the site has.
 *
 * Driven by the product registry so a new product is a new page with no second
 * edit. `areas.ts` is the only place a product is defined.
 */
export function allRoutes(): Route[] {
  return [
    { kind: 'home', path: HOME_PATH },
    { kind: 'productIndex', path: PRODUCTS_PATH },
    ...products.map((product) => ({
      kind: 'product' as const,
      path: productPath(product.id),
      id: product.id,
    })),
  ];
}
