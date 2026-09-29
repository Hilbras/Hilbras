import { ArrowUpRight, Menu, X } from 'lucide-react';
import { areas, productsInArea } from '../../data/areas';
import { navLinks, site } from '../../data/site';
import { ThemeToggle } from '../ThemeToggle';
import { useDisclosure } from '../ui/Reveal';
import { Mark } from '../ui/Mark';
import { ProductLink } from '../ui/ProductLink';

type NavbarActionsProps = {
  mobile: ReturnType<typeof useDisclosure>;
};

/**
 * The right-hand cluster: the organisation link, the closing call to action, the
 * theme control, and — below the large breakpoint — the menu button.
 */
export function NavbarActions({ mobile }: NavbarActionsProps) {
  return (
    <div className="ml-auto flex items-center gap-2.5">
      <a
        href={site.organisation.github}
        className="btn-quiet hidden xl:inline-flex"
        target="_blank"
        rel="noreferrer noopener"
      >
        GitHub
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <a href="/#start" className="btn-gold hidden sm:inline-flex">
        Get started
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
      <ThemeToggle />
      <button
        type="button"
        aria-label={mobile.isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobile.isOpen}
        onClick={mobile.toggle}
        className="muted grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-bg-soft hover:text-gold-text lg:hidden"
      >
        {mobile.isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

type MobileNavigationProps = {
  disclosure: ReturnType<typeof useDisclosure>;
};

/**
 * The menu below the large breakpoint.
 *
 * Rendered rather than reordered: the desktop links stay in the DOM and are
 * hidden by a `lg` media query, so the tab order matches the visual order at
 * every width. Choosing between the two in JavaScript instead would mean the
 * server-rendered markup did not match the width, which is a hydration hazard
 * for no benefit.
 */
export function MobileNavigation({ disclosure }: MobileNavigationProps) {
  if (!disclosure.mounted) return null;

  return (
    <div
      data-state={disclosure.state}
      className="disclosure-mobile overflow-hidden border-t border-line bg-bg-soft/95 lg:hidden"
    >
      <div className="shell max-h-[70vh] overflow-y-auto py-3">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={disclosure.close} className="nav-link px-2 py-2.5">
            {link.label}
          </a>
        ))}

        <p className="mono-label mt-3 px-2">Products</p>
        {areas.map((area) => (
          <div key={area.id} className="mt-2 px-2">
            <p className="text-13 font-semibold">{area.name}</p>
            <ul className="mt-1 space-y-0.5">
              {productsInArea(area.id).map((product) => (
                <li key={`${area.id}-${product.id}`}>
                  <ProductLink
                    product={product}
                    onClick={disclosure.close}
                    className="flex items-center gap-2 rounded-md py-1.5 text-13 text-muted"
                  >
                    <Mark id={product.mark} className="h-4 w-4 shrink-0 text-gold" />
                    {product.name}
                  </ProductLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <a
          href={site.organisation.github}
          onClick={disclosure.close}
          className="btn-ghost mt-4 w-full"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <a href="/#start" onClick={disclosure.close} className="btn-gold mt-2 w-full">
          Get started
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
