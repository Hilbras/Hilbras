import { useId } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { areas, productsInArea } from '../../data/areas';
import { useDisclosure } from '../ui/Reveal';
import { Mark } from '../ui/Mark';
import { ProductLink } from '../ui/ProductLink';
import { StatusPill } from '../ui/StatusPill';
import type { HoverIntent } from './useHoverIntent';

type ProductsMenuProps = {
  disclosure: ReturnType<typeof useDisclosure>;
  hover: HoverIntent;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
};

/**
 * The products disclosure.
 *
 * A button, not a hover-only menu. Focus alone does not open it — otherwise the
 * first Enter press would immediately close what focusing had just opened, which
 * is the behaviour a keyboard user meets on their very first attempt. Click
 * toggles, Escape and blur dismiss, and the pointer can do either with intent.
 *
 * The panel lists every product under the area that owns it, with a one-line
 * summary and its status. A product in two areas appears under both, which is
 * the point: the taxonomy is what the panel exists to show.
 */
export function ProductsMenu({ disclosure, hover, buttonRef }: ProductsMenuProps) {
  const menuId = useId();

  return (
    <div
      className="relative"
      onMouseEnter={hover.scheduleOpen}
      onMouseLeave={hover.scheduleClose}
      onBlur={(event) => {
        // Only a real departure from the widget closes it. Tabbing between the
        // trigger and an item inside the panel moves focus within the subtree,
        // which `contains` is what distinguishes.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          hover.cancel();
          disclosure.close();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="nav-link inline-flex items-center gap-1"
        aria-expanded={disclosure.isOpen}
        aria-controls={menuId}
        onClick={() => {
          // A click is a decision, so it overrides whatever the pointer was
          // about to do rather than racing it.
          hover.cancel();
          disclosure.toggle();
        }}
      >
        Products
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${disclosure.isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {disclosure.mounted ? (
        <div
          id={menuId}
          data-state={disclosure.state}
          className="disclosure absolute top-full left-1/2 w-[560px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 pt-3"
        >
          {/*
            Every area with a line of summary each is taller than a short
            viewport, so the panel scrolls inside itself rather than running off
            the bottom of the screen. Measured: it fits at 1000px, scrolls at
            700px and 560px, and never overflows.
          */}
          <div className="card max-h-[min(38rem,calc(100vh-7rem))] overflow-y-auto overscroll-contain p-2">
            <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {areas.map((area) => (
                <li key={area.id} className="min-w-0 px-2 py-2">
                  <p className="mono-label">{area.name}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {productsInArea(area.id).map((product) => (
                      <li key={`${area.id}-${product.id}`} className="min-w-0">
                        <ProductLink
                          product={product}
                          className="flex items-center gap-2 rounded-md px-1.5 py-1 text-13 text-muted transition-colors hover:bg-gold-soft hover:text-gold-text"
                          onClick={disclosure.close}
                        >
                          <Mark id={product.mark} className="h-3.5 w-3.5 shrink-0 text-gold" />
                          <span className="min-w-0">
                            <span className="block truncate">{product.name}</span>
                            <span className="muted block truncate text-11">{product.summary}</span>
                          </span>
                          <StatusPill status={product.status} compact />
                        </ProductLink>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <div className="mt-1 border-t border-line px-2 pt-2 pb-1">
              <a
                href="/products"
                className="btn-quiet !px-1.5 !py-1.5 text-13 text-gold-text"
                onClick={disclosure.close}
              >
                All products
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
