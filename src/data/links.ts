import type { Product } from './areas';
import { productPath } from '../routes';

/**
 * Where the products list lives on the homepage, for links that are about
 * products in general rather than one of them.
 */
export const PRODUCTS_ANCHOR = '#products';

/**
 * The href for a product.
 *
 * Every product has a page now, so this is always the product's own address. It
 * used to fall back to the homepage's products section for a product with no
 * site of its own, and to the product's own site for the rest — which meant
 * three products had nowhere to link and eight linked straight out to GitHub. So
 * eight of eleven products had no presence in search results at all, and the
 * ones that did were described by whatever the repository's README happened to
 * say rather than by the registry.
 *
 * The product page is where the registry meets the outside world. It carries the
 * repository and site links, and it can be indexed and linked to.
 */
export function productHref(product: Pick<Product, 'id'>): string {
  return productPath(product.id);
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
