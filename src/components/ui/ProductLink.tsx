import type { ReactNode } from 'react';
import type { Product } from '../../data/areas';
import { productHref } from '../../data/links';

type ProductLinkProps = {
  product: Pick<Product, 'id' | 'name'>;
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
 * Every product has a page now, so these are internal links: they navigate
 * rather than open a new tab, and carry no `target` or `rel`. Six components
 * used to each reimplement that decision, and two had shipped the
 * "opens in a new tab" announcement with different wording.
 */
export function ProductLink({ product, className, children, onClick }: ProductLinkProps) {
  return (
    <a href={productHref(product)} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
