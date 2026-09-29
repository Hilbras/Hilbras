import type { Product } from './areas';

/**
 * Where a product link goes when the product has no public site yet.
 *
 * One constant, because the same fallback appeared in six components and any
 * change to it had to be made six times.
 */
export const PRODUCTS_ANCHOR = '#products';

/** The href for a product, whether or not it has a site of its own. */
export function productHref(product: Pick<Product, 'href'>): string {
  return product.href ?? PRODUCTS_ANCHOR;
}

/**
 * Whether a link leaves the site. Drives `target`, `rel`, and the
 * "opens in a new tab" announcement, all of which are easy to get wrong in one
 * place and consistently wrong in six.
 */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** `rel` for an external link. Empty for an internal one, so the attribute is omitted. */
export function externalRel(href: string): 'noreferrer noopener' | undefined {
  return isExternalHref(href) ? 'noreferrer noopener' : undefined;
}
