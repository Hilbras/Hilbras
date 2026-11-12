import { ArrowUpRight, Star } from "lucide-react";
import { areaById, type Product } from "@/data/areas";
import { GitHubMark } from "@/components/ui/GitHubMark";
import { ProductLink } from "@/components/ui/ProductLink";
import { ProductMark } from "@/components/ui/ProductMark";
import { Reveal } from "@/components/ui/Reveal";
import { StatusPill } from "@/components/ui/StatusPill";

type ProductCardProps = {
  product: Product;
};

const cardBase = "card group relative flex h-full flex-col overflow-hidden";

function ProductName({ product, className }: ProductCardProps & { className: string }) {
  return (
    <h3 className={className}>
      <ProductLink product={product} className="inline-flex items-center gap-1.5 font-medium hover:text-gold-text">
        {product.name}
      </ProductLink>
    </h3>
  );
}

function ProductLinks({ product }: ProductCardProps) {
  const isPublic = Boolean(product.href || product.repository);

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
      {isPublic ? null : (
        <span className="muted font-mono text-11">No public release yet</span>
      )}
    </>
  );
}

function ProductMetrics({ product }: ProductCardProps) {
  if (!product.developer) return null;

  const metrics: { label: string; value: string; icon?: typeof Star }[] = [];
  metrics.push({ label: "Published version", value: `v${product.developer.version}` });
  metrics.push({ label: "Last verified", value: product.developer.verified });

  return (
    <ul className="muted -mt-2 mb-6 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 font-mono text-11">
      {metrics.map((metric) => (
        <li key={metric.label} className="flex min-w-0 items-center gap-1">
          {metric.icon ? <metric.icon className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
          <span className="sr-only">{metric.label}: </span>
          <span className="truncate">{metric.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const area = areaById.get(product.area);

  return (
    <Reveal as="article" variant="card" className={`${cardBase} p-6`}>
      <div className="mb-7 flex items-start justify-between gap-3">
        <ProductMark mark={product.mark} name={product.name} />
        <StatusPill status={product.status} />
      </div>

      <ProductName product={product} className="relative text-lg font-semibold tracking-card" />
      {area ? <p className="mono-label mt-1.5">{area.name}</p> : null}
      <p className="muted mt-3 mb-6 text-sm leading-relaxed">{product.description}</p>

      <ProductMetrics product={product} />

      <div className="mt-auto flex min-h-9 flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs">
        <ProductLinks product={product} />
      </div>

      <div className="card-glow" aria-hidden="true" />
    </Reveal>
  );
}

export function ProductGrid({
  items,
  columns = 3,
}: {
  items: readonly Product[];
  columns?: 2 | 3 | 4;
}) {
  const wide = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[
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
