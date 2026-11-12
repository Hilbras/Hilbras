import type { ReactNode } from "react";
import Link from "next/link";
import type { Product } from "@/data/areas";

type ProductLinkProps = {
  product: Product;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  /**
   * Where the link goes. Defaults to the product's own page at
   * `/products/{id}`; every product has one, including the ones with no
   * public release yet — the page is where the site explains what the product
   * is and why there is nothing to install.
   */
  href?: string;
};

export function ProductLink({ product, className, children, onClick, href }: ProductLinkProps) {
  const target = href ?? `/products/${product.id}`;

  return (
    <Link href={target} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
