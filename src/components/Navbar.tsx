import { useEffect, useId, useRef } from 'react';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { areas, productsInArea } from '../data/areas';
import { navLinks, site } from '../data/site';
import { HilbrasMark, Mark } from './ui/Mark';
import { ProductLink } from './ui/ProductLink';
import { useDisclosure } from './ui/Reveal';
import { StatusPill } from './ui/StatusPill';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const productsButtonRef = useRef<HTMLButtonElement>(null);
  const productsMenuId = useId();

  // Each panel stays mounted for the length of its close transition, so the
  // exit is animated rather than cut off.
  const mobile = useDisclosure(200);
  const dropdown = useDisclosure(180);

  // A hover intent delay. Pointer users get the menu without a click, and the
  // panel still closes the moment focus or intent leaves it.
  const closeTimer = useRef<number | undefined>(undefined);
  const openTimer = useRef<number | undefined>(undefined);

  const { close: closeMobile } = mobile;
  const { close: closeDropdown, open: openDropdown } = dropdown;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeMobile();
      closeDropdown();
      productsButtonRef.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [closeMobile, closeDropdown]);

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(openTimer.current);
    },
    [],
  );

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(closeDropdown, 120);
  };
  const scheduleOpen = () => {
    cancelClose();
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(openDropdown, 80);
  };

  return (
    <header className="nav-blur sticky top-0 z-50 border-b border-line/70">
      <nav className="shell relative flex h-16 items-center gap-6" aria-label="Main">
        <a href="#main" className="skip-link btn-gold">
          Skip to content
        </a>

        <a
          href="#main"
          className="flex shrink-0 items-center gap-2.5 rounded-lg text-[15px] font-semibold tracking-tight"
        >
          <HilbrasMark className="h-[18px] w-[18px] text-gold" />
          <span>{site.name}</span>
        </a>

        <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 lg:flex">
          {/*
            A disclosure button, not a hover-only menu. Focus alone does not open
            it — otherwise the first Enter press would immediately close what the
            focus handler had just opened. Escape and blur both dismiss it.
          */}
          <div
            className="relative"
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) dropdown.close();
            }}
          >
            <button
              ref={productsButtonRef}
              type="button"
              className="nav-link inline-flex items-center gap-1"
              aria-expanded={dropdown.isOpen}
              aria-controls={productsMenuId}
              onClick={dropdown.toggle}
            >
              Products
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${dropdown.isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {dropdown.mounted ? (
              <div
                id={productsMenuId}
                data-state={dropdown.state}
                className="disclosure absolute top-full left-1/2 w-[560px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 pt-3"
              >
                {/* Six areas of products with a line of summary each is taller
                    than a short viewport. Scroll inside the panel rather than
                    letting it run off the bottom of the screen. */}
                <div className="card max-h-[min(38rem,calc(100vh-7rem))] overflow-y-auto overscroll-contain p-2">
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {areas.map((area) => (
                      <li key={area.id} className="px-2 py-2">
                        <p className="mono-label">{area.name}</p>
                        <ul className="mt-1.5 space-y-0.5">
                          {productsInArea(area.id).map((product) => (
                            <li key={`${area.id}-${product.id}`}>
                              <ProductLink
                                product={product}
                                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-muted transition-colors hover:bg-gold-soft hover:text-gold-text"
                                onClick={dropdown.close}
                              >
                                <Mark id={product.mark} className="h-3.5 w-3.5 shrink-0 text-gold" />
                                <span className="min-w-0">
                                  <span className="block truncate">{product.name}</span>
                                  <span className="muted block truncate text-[11px]">{product.summary}</span>
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
                      href="#products"
                      className="btn-quiet !px-1.5 !py-1.5 text-[13px] text-gold-text"
                      onClick={dropdown.close}
                    >
                      All products
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

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
          <a href="#start" className="btn-gold hidden sm:inline-flex">
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
            {mobile.isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {mobile.mounted ? (
        <div data-state={mobile.state} className="disclosure-mobile overflow-hidden border-t border-line bg-bg-soft/95 lg:hidden">
          <div className="shell max-h-[70vh] overflow-y-auto py-3">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={mobile.close} className="nav-link px-2 py-2.5">
                {link.label}
              </a>
            ))}

            <p className="mono-label mt-3 px-2">Products</p>
            {areas.map((area) => (
              <div key={area.id} className="mt-2 px-2">
                <p className="text-[13px] font-semibold">{area.name}</p>
                <ul className="mt-1 space-y-0.5">
                  {productsInArea(area.id).map((product) => (
                    <li key={`${area.id}-${product.id}`}>
                      <ProductLink
                        product={product}
                        onClick={mobile.close}
                        className="flex items-center gap-2 rounded-md py-1.5 text-[13px] text-muted"
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
              onClick={mobile.close}
              className="btn-ghost mt-4 w-full"
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a href="#start" onClick={mobile.close} className="btn-gold mt-2 w-full">
              Get started
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
