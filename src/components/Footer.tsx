import { areaById, products } from '../data/areas';
import { externalRel, isExternalHref } from '../data/links';
import { footerGroups, site } from '../data/site';
import { HilbrasMark } from './ui/Mark';
import { ProductLink } from './ui/ProductLink';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.5fr_0.8fr_0.8fr]">
        <div>
          <a href="#main" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
            <HilbrasMark className="h-[18px] w-[18px] text-gold" />
            <span>{site.name}</span>
          </a>
          <p className="muted mt-3 max-w-[26ch] text-[13px] leading-relaxed">{site.tagline}</p>
          <a href="#start" className="btn-gold mt-5 !px-3.5 !py-2 !text-[13px]">
            Get started
          </a>
        </div>

        <nav aria-labelledby="footer-products">
          <h2 id="footer-products" className="mono-label">
            Products
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            {products.map((product) => {
              const area = areaById.get(product.area);
              return (
                <li key={product.id} className="min-w-0">
                  <ProductLink product={product} className="footer-link block truncate">
                    {product.name}
                  </ProductLink>
                  {area ? <span className="muted block truncate text-[11px]">{area.short}</span> : null}
                </li>
              );
            })}
          </ul>
        </nav>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-labelledby={`footer-${group.title}`}>
            <h2 id={`footer-${group.title}`} className="mono-label">
              {group.title}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {group.links.map((link) => {
                const external = isExternalHref(link.href);
                return (
                  <li key={link.href}>
                    <a href={link.href} className="footer-link" rel={externalRel(link.href)} target={external ? '_blank' : undefined}>
                      {link.label}
                      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <span className="muted">
            © {year} {site.organisation.legalName}. All rights reserved.
          </span>
          <span className="muted font-mono">An ecosystem, not a monolith.</span>
        </div>
      </div>
    </footer>
  );
}
