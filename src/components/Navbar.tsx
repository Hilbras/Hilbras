"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { areas, productsInArea } from "@/data/areas";
import { navLinks, site } from "@/data/site";
import { HilbrasMark, Mark } from "@/components/ui/Mark";
import { ProductLink } from "@/components/ui/ProductLink";
import { StatusPill } from "@/components/ui/StatusPill";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimer = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const openProducts = () => {
    window.clearTimeout(hoverTimer.current);
    setProductsOpen(true);
  };

  const closeProducts = () => {
    hoverTimer.current = window.setTimeout(() => setProductsOpen(false), 120);
  };

  const cancelProducts = () => {
    window.clearTimeout(hoverTimer.current);
    setProductsOpen(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelProducts();
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(
    () => () => window.clearTimeout(hoverTimer.current),
    [],
  );

  return (
    <header className="nav-blur sticky top-0 z-50 border-b border-line/70">
      <nav className="shell relative flex h-16 items-center gap-6" aria-label="Main">
        <a href="#main" className="skip-link btn-gold">
          Skip to content
        </a>

        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg text-15 font-semibold tracking-tight">
          <HilbrasMark className="h-[18px] w-[18px] text-gold" />
          <span>{site.name}</span>
        </Link>

        <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 lg:flex">
          <div
            ref={containerRef}
            onMouseEnter={openProducts}
            onMouseLeave={closeProducts}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                cancelProducts();
              }
            }}
          >
            <button
              type="button"
              className="nav-link inline-flex items-center gap-1"
              aria-expanded={productsOpen}
              onClick={() => {
                cancelProducts();
                setProductsOpen((open) => !open);
              }}
            >
              Products
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {productsOpen ? (
              <div className="disclosure absolute top-full left-1/2 w-[880px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 pt-3">
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
                                onClick={cancelProducts}
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
          <Link href="/#start" className="btn-gold hidden sm:inline-flex">
            Get started
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <ThemeToggle />
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="muted grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-bg-soft hover:text-gold-text lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="disclosure-mobile overflow-hidden border-t border-line bg-bg-soft/95 lg:hidden">
          <div className="shell max-h-[70vh] overflow-y-auto py-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="nav-link px-2 py-2.5"
              >
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
                        onClick={() => setMobileOpen(false)}
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
              onClick={() => setMobileOpen(false)}
              className="btn-ghost mt-4 w-full"
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <Link href="/#start" onClick={() => setMobileOpen(false)} className="btn-gold mt-2 w-full">
              Get started
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
