import type { ReactNode } from 'react';
import type { Product } from '../../data/areas';
import { externalRel, isExternalHref, productHref } from '../../data/links';

type ProductLinkProps = {
  product: Pick<Product, 'name' | 'href'>;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  /**
   * For a link whose visible text does not already name the product — an
   * icon-only control, say. Every current caller renders the name, so the
   * announcement stays short; without this the name is read twice, because
   * `children` has already spoken it.
   */
  nameIsNotVisible?: boolean;
};

/**
 * The single place a product link is built.
 *
 * A product with no public site falls back to the products section; anything
 * with a site opens in a new tab with a safe `rel` and the "opens in a new tab"
 * announcement for screen readers. Six components were each reimplementing that
 * decision, and two of them had shipped it slightly differently.
 */
export function ProductLink({ product, className, children, onClick, nameIsNotVisible }: ProductLinkProps) {
  const href = productHref(product);
  const external = isExternalHref(href);

  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={externalRel(href)}
    >
      {children}
      {external ? (
        <span className="sr-only">
          {nameIsNotVisible ? ` — ${product.name}` : ''} (opens in a new tab)
        </span>
      ) : null}
    </a>
  );
}
