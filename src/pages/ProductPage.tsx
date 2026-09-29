import { ArrowUpRight, FileText, Globe } from 'lucide-react';
import { areas, products, type Product } from '../data/areas';
import { statusDefinitions, statusLabels } from '../data/areas';
import { counts, site } from '../data/site';
import { productPath } from '../routes';
import { GitHubMark } from '../components/ui/GitHubMark';
import { Mark } from '../components/ui/Mark';
import { ProductMark } from '../components/ui/ProductMark';
import { StatusPill } from '../components/ui/StatusPill';
import { Reveal } from '../components/ui/Reveal';

/**
 * One product.
 *
 * Every section here renders from a field that already exists in the product
 * registry, and each is conditional on that field being present. That
 * constraint is deliberate: the alternative is a page with an empty "Use cases"
 * heading on nine of eleven products, or invented content presented as fact.
 *
 * What a product page can honestly say today:
 *
 * - what it is, and which areas of the ecosystem it belongs to
 * - how mature it is, in words rather than a coloured pill
 * - where to get it: the site, the repository, the documentation
 * - what it runs on
 * - what else is in the same areas, which is the "connected ecosystem" idea made
 *   concrete for one product
 *
 * The "technical" and "use case" sections a product page usually carries are
 * here as slots with no content behind them, because inventing eleven products'
 * feature lists is not something a website should do. They appear the day the
 * data supports them.
 */
export function ProductPage({ product }: { product: Product }) {
  const productAreas = areas.filter((area) => area.products.includes(product.id));

  // Products sharing at least one area, minus this one, and without repeating a
  // product that is in two of the same areas.
  const related = products.filter(
    (candidate) =>
      candidate.id !== product.id &&
      productAreas.some((area) => area.products.includes(candidate.id)),
  );

  const isPublic = Boolean(product.href || product.repository);

  return (
    <>
      <section id="overview" aria-labelledby="overview-heading" className="relative overflow-hidden border-b border-line/70">
        <div aria-hidden="true" className="bg-glow absolute inset-x-0 top-0 h-[520px] opacity-60" />

        <div className="shell relative pb-14 pt-14 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true" />
                {productAreas.map((area) => area.name).join(' · ')}
              </span>
            </Reveal>

            <Reveal className="mt-6 flex justify-center">
              <ProductMark mark={product.mark} name={product.name} className="h-14 w-14 text-gold" glyph="h-7 w-7" />
            </Reveal>

            <Reveal className="mt-5 flex justify-center">
              <StatusPill status={product.status} />
            </Reveal>

            <Reveal className="mt-6">
              <h1 id="overview-heading" className="display-title text-4xl sm:text-5xl text-balance">
                {product.name}
              </h1>
            </Reveal>

            <Reveal className="mt-5">
              <p className="muted mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
                {product.summary}
              </p>
            </Reveal>

            <ProductResources product={product} />
          </div>
        </div>
      </section>

      <section aria-labelledby="description-heading" className="section-band border-b border-line/70">
        <div className="shell section-pad">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 id="description-heading" className="section-title text-2xl sm:text-3xl">
                What it is
              </h2>
            </Reveal>
            <Reveal className="mt-5">
              <p className="muted text-base leading-relaxed">{product.description}</p>
            </Reveal>

            {!isPublic ? (
              <Reveal className="mt-8 rounded-xl border border-dashed border-line-strong bg-surface-2/50 p-5">
                <h3 className="text-sm font-semibold">No public release yet</h3>
                <p className="muted mt-2 text-sm leading-relaxed">
                  {product.name} has no public repository and no deployed site. It is listed because it is
                  part of the plan, not because it is finished. Nothing here is a supported release.
                </p>
              </Reveal>
            ) : null}

            <Reveal className="mt-10">
              <h3 className="mono-label">Maturity</h3>
              <p className="mt-3 text-base leading-relaxed">
                <strong className="font-semibold">{statusLabels[product.status]}.</strong>{' '}
                <span className="muted">{statusDefinitions[product.status]}</span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <ProductFacts product={product} areas={productAreas} />

      {related.length > 0 ? <RelatedProducts product={product} related={related} /> : null}

      <section aria-labelledby="next-heading" className="border-t border-line/70">
        <div className="shell section-pad text-center">
          <Reveal>
            <h2 id="next-heading" className="section-title text-2xl sm:text-3xl">
              {isPublic ? 'Follow along' : `The rest of the ecosystem`}
            </h2>
            <p className="muted mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base">
              {isPublic
                ? `${product.name} is one of ${counts.products} products Hilbras is building, across ${counts.areas} technology areas.`
                : `Hilbras builds ${counts.products} products across ${counts.areas} technology areas. This one is still taking shape.`}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="/products" className="btn-gold">
                All products
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href={site.organisation.github} className="btn-ghost" target="_blank" rel="noreferrer noopener">
                Hilbras on GitHub
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/**
 * The three places a product can be reached, each only when it exists.
 *
 * Nothing is rendered for a link that does not exist, and nothing points at a
 * placeholder. This is the reason the homepage could link eight of eleven
 * products to their repository and three to nothing: there was nowhere else to
 * send them.
 */
function ProductResources({ product }: { product: Product }) {
  const resources = [
    product.href
      ? { href: product.href, label: 'Visit the site', Icon: Globe, external: true }
      : null,
    product.repository
      ? { href: product.repository, label: 'View the source', Icon: GitHubMark, external: true }
      : null,
    product.documentation
      ? { href: product.documentation, label: 'Read the documentation', Icon: FileText, external: true }
      : null,
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (resources.length === 0) return null;

  return (
    <Reveal className="mt-9">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {resources.map(({ href, label, Icon, external }) => (
          <a
            key={label}
            href={href}
            className={label === 'Visit the site' ? 'btn-gold' : 'btn-ghost'}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer noopener' : undefined}
          >
            <Icon className="h-4 w-4" />
            {label}
            {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
          </a>
        ))}
      </div>
    </Reveal>
  );
}

/** The technical facts the registry actually holds. Omitted when there are none. */
function ProductFacts({ product, areas: productAreas }: { product: Product; areas: typeof areas }) {
  const kindLabel: Record<Product['kind'], string> = {
    library: 'Library',
    service: 'Service',
    platform: 'Platform',
    application: 'Application',
    system: 'Operating system',
  };

  const facts: { label: string; value: string }[] = [
    { label: 'Kind', value: kindLabel[product.kind] },
    // Only when it is specific. "Cross-platform" would be true of almost
    // everything and would tell a reader nothing.
    ...(product.platform ? [{ label: 'Runs on', value: product.platform }] : []),
    { label: 'Area', value: productAreas.map((area) => area.name).join(', ') },
    { label: 'Maturity', value: statusLabels[product.status] },
  ];

  return (
    <section aria-labelledby="facts-heading" className="border-b border-line/70">
      <div className="shell section-pad">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 id="facts-heading" className="section-title text-2xl sm:text-3xl">
              At a glance
            </h2>
          </Reveal>
          <Reveal className="mt-7">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="border-t border-line pt-4">
                  <dt className="mono-label">{fact.label}</dt>
                  <dd className="mt-1.5 text-[15px] font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Other products in the same areas. This is the "connected ecosystem" idea per product. */
function RelatedProducts({ product, related }: { product: Product; related: Product[] }) {
  return (
    <section aria-labelledby="related-heading" className="section-band border-b border-line/70">
      <div className="shell section-pad">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 id="related-heading" className="section-title text-2xl sm:text-3xl">
              Shares an area with
            </h2>
            <p className="muted mt-4 max-w-xl text-sm leading-relaxed">
              Neighbouring work rather than a dependency list. {product.name} does not require any of these,
              and none of them require it.
            </p>
          </Reveal>

          <Reveal className="mt-8">
            <ul className="grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.id}>
                  <a
                    href={productPath(item.id)}
                    className="card group flex h-full items-center gap-3 p-4 transition-colors hover:border-gold/40"
                  >
                    <Mark id={item.mark} className="h-6 w-6 shrink-0 text-gold" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{item.name}</span>
                      <span className="muted block truncate text-[12px]">{item.summary}</span>
                    </span>
                    <StatusPill status={item.status} compact />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
