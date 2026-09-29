import { ArrowUpRight } from 'lucide-react';
import { areaById, type Product } from '../data/areas';
import { GitHubMark } from './ui/GitHubMark';
import { ProductMark } from './ui/ProductMark';
import { Reveal } from './ui/Reveal';
import { StatusPill } from './ui/StatusPill';

type ProductCardProps = {
  product: Product;
};

/**
 * Both card sizes are the same element: an `<article>` that is also the scroll
 * reveal. Making the reveal wrapper *be* the card avoids a div that exists only
 * to carry the animation, and keeps the heading's parent the same in every
 * product card regardless of size.
 */
const cardBase = 'card group relative flex h-full flex-col overflow-hidden';

function ProductLinks({ product }: ProductCardProps) {
  const hasLink = Boolean(product.href || product.repository);
  return (
    <>
      {product.href ? (
        <a
          href={product.href}
          className="inline-flex items-center gap-1.5 font-medium text-gold-text transition-opacity hover:opacity-75"
          target="_blank"
          rel="noreferrer noopener"
        >
          Visit site
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">— {product.name} (opens in a new tab)</span>
        </a>
      ) : null}
      {product.repository ? (
        <a
          href={product.repository}
          className="muted inline-flex items-center gap-1.5 transition-colors hover:text-gold-text"
          target="_blank"
          rel="noreferrer noopener"
        >
          <GitHubMark className="h-3.5 w-3.5" />
          Source
          <span className="sr-only">for {product.name} (opens in a new tab)</span>
        </a>
      ) : null}
      {hasLink ? null : <span className="muted font-mono text-[11px]">No public release yet</span>}
    </>
  );
}

/** The larger card that opens the grid. Which products get it is a data flag. */
export function FeaturedProductCard({ product }: ProductCardProps) {
  const area = areaById.get(product.area);

  return (
    <Reveal as="article" variant="card" className={`${cardBase} p-7 sm:p-8`}>
      <div aria-hidden="true" className="glow-wash pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-50 blur-3xl" />
      <div className="relative mb-8 flex items-start justify-between gap-3">
        <ProductMark mark={product.mark} name={product.name} className="h-12 w-12" glyph="h-6 w-6" />
        <StatusPill status={product.status} />
      </div>

      <h3 className="relative text-2xl font-semibold tracking-[-0.03em]">{product.name}</h3>
      {area ? <p className="mono-label relative mt-2">{area.name}</p> : null}
      <p className="muted relative mt-4 mb-7 max-w-lg text-sm leading-relaxed sm:text-base">{product.description}</p>

      <div className="relative mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-5">
        {product.repository ? (
          <a href={product.repository} className="btn-ghost !text-[13px]" target="_blank" rel="noreferrer noopener">
            <GitHubMark />
            View source
            <span className="sr-only">for {product.name} (opens in a new tab)</span>
          </a>
        ) : null}
        {product.href ? (
          <a
            href={product.href}
            className="btn-quiet text-gold-text"
            target="_blank"
            rel="noreferrer noopener"
          >
            Visit site
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">— {product.name} (opens in a new tab)</span>
          </a>
        ) : null}
      </div>

      <div className="card-glow" aria-hidden="true" />
    </Reveal>
  );
}

/** The standard card, used by the grid under the featured row. */
export function ProductCard({ product }: ProductCardProps) {
  const area = areaById.get(product.area);

  return (
    <Reveal as="article" variant="card" className={`${cardBase} p-6`}>
      <div className="mb-7 flex items-start justify-between gap-3">
        <ProductMark mark={product.mark} name={product.name} />
        <StatusPill status={product.status} />
      </div>

      <h3 className="text-lg font-semibold tracking-[-0.02em]">{product.name}</h3>
      {area ? <p className="mono-label mt-1.5">{area.name}</p> : null}
      <p className="muted mt-3 mb-6 text-sm leading-relaxed">{product.description}</p>

      {/* The description owns the minimum gap; `mt-auto` absorbs the rest, so the
          rule and the links sit on the same baseline in every card. */}
      <div className="mt-auto flex min-h-9 flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[12px]">
        <ProductLinks product={product} />
      </div>

      <div className="card-glow" aria-hidden="true" />
    </Reveal>
  );
}

/**
 * `columns` is passed in rather than hard-coded so the caller can balance the
 * last row: seven products read better in four columns than in three.
 */
export function ProductGrid({ items, columns = 3 }: { items: readonly Product[]; columns?: 2 | 3 | 4 }) {
  const wide = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[
    columns
  ];

  return (
    <div className={`stagger grid gap-4 ${wide}`}>
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
