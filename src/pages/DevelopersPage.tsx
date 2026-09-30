import { ArrowUpRight, Package, Terminal } from 'lucide-react';
import { productPath } from '../routes';
import { publishedPackages, registryLicence, registryRead, sourceOnlyProducts } from '../data/areas';
import { Mark } from '../components/ui/Mark';
import { ProductLink } from '../components/ui/ProductLink';
import { Reveal } from '../components/ui/Reveal';
import { Section, SectionHeader } from '../components/ui/Section';
import { StatusPill } from '../components/ui/StatusPill';

/**
 * The developer page: what can be installed, and how.
 *
 * Every product page carries an **Install it** section, which is the right place
 * to answer "how do I use *this*". This page answers a different question —
 * "what can I install at all?" — which previously meant visiting five product
 * pages one at a time and knowing in advance which five.
 *
 * Everything here is read from `product.developer`, the same field the product
 * pages and the structured data use. There is no list on this page, so a product
 * cannot appear here and be missing from its own page, or the reverse: gaining a
 * `developer` block is the only edit, and the package count, the list, the
 * JSON-LD and the per-product install sections all follow from it.
 *
 * **The versions are dated on the page.** A registry version goes out of date,
 * and a page quoting an old one without saying when is a small lie. The dates
 * come from the data, so the claim cannot drift from the values it qualifies.
 *
 * What this page deliberately does *not* do: document an API, or link
 * documentation. There is no verified documentation site for any of these
 * packages, and inventing one would be the single most damaging thing this
 * project could do — a developer who follows a link that 404s does not come back.
 */

/**
 * When the versions were read, stated once.
 *
 * Derived from the data rather than written, so it cannot go stale independently
 * of the versions it qualifies — the failure being a page claiming a reading date
 * that no longer matches the versions above it.
 */
const readSentence = (() => {
  if (!registryRead) return 'No package is published to a registry yet.';
  if (registryRead.uniform) {
    return `Every version below was read from the npm registry on ${registryRead.earliest}.`;
  }
  return `Versions below were read from the npm registry between ${registryRead.earliest} and ${registryRead.latest}.`;
})();

/** One installable package, with everything the registry actually holds. */
function PackageCard({ product }: { product: (typeof publishedPackages)[number] }) {
  const developer = product.developer!;

  return (
    <li>
      <ProductLink
        product={product}
        className="card group flex h-full flex-col gap-3 p-5 transition-colors hover:border-gold/40"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2.5">
            <Mark id={product.mark} className="h-5 w-5 shrink-0 text-gold" />
            <span className="truncate text-15 font-medium">{product.name}</span>
          </span>
          <StatusPill status={product.status} compact />
        </span>

        <span className="muted block text-13 leading-relaxed">{product.summary}</span>

        <span className="mt-auto block overflow-hidden rounded-lg border border-line bg-surface-2/60">
          <span className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
            <code className="min-w-0 truncate font-mono text-12 text-gold-text">{developer.package}</code>
            <span className="muted shrink-0 font-mono text-11">
              v{developer.version} · {developer.license}
            </span>
          </span>
          <code className="block overflow-x-auto px-3 py-2.5 font-mono text-12">
            {developer.install}
          </code>
        </span>
      </ProductLink>
    </li>
  );
}

export function DevelopersPage() {
  return (
    <>
      <section aria-labelledby="developers-heading" className="relative overflow-hidden border-b border-line/70">
        <div aria-hidden="true" className="bg-glow absolute inset-x-0 top-0 h-[420px] opacity-60" />

        <div className="shell relative pb-14 pt-14 text-center sm:pb-20 sm:pt-20">
          <Reveal>
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              For developers
            </span>
          </Reveal>
          <Reveal className="mt-6">
            <h1 id="developers-heading" className="display-title text-4xl sm:text-5xl">
              Install something
            </h1>
          </Reveal>
          <Reveal className="mt-5">
            <p className="muted mx-auto max-w-2xl text-base leading-relaxed">
              {publishedPackages.length} of Hilbras&rsquo;s products are published to npm
              {registryLicence ? `, all under the ${registryLicence} licence` : ''}, and each is usable
              on its own. {readSentence}
            </p>
          </Reveal>
        </div>
      </section>

      <Section id="packages" band>
        <SectionHeader
          id="packages-heading"
          eyebrow="On npm"
          title="Published packages"
          lede="No account, no bundle and no other Hilbras package is required to use any of these. Each one is a standalone product with its own release history."
        />

        <ul className="stagger mt-10 grid gap-4 sm:grid-cols-2">
          {publishedPackages.map((product) => (
            <PackageCard key={product.id} product={product} />
          ))}
        </ul>
      </Section>

      <Section id="not-published" band>
        <SectionHeader
          id="not-published-heading"
          eyebrow="Honest inventory"
          title="What is not on a registry"
          lede={`The other ${sourceOnlyProducts.length} products have no published package. They are listed here so the absence is stated rather than left to be discovered — a developer looking for something to install should not have to guess whether a page simply forgot to mention it.`}
        />

        <ul className="stagger mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sourceOnlyProducts.map((product) => (
            <li key={product.id}>
              <ProductLink
                product={product}
                className="card group flex h-full items-center gap-3 p-4 transition-colors hover:border-gold/40"
              >
                <Mark id={product.mark} className="h-4 w-4 shrink-0 text-gold" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-14 font-medium">{product.name}</span>
                  <span className="muted block truncate text-2xs">{product.summary}</span>
                </span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 shrink-0 text-muted opacity-60"
                  aria-hidden="true"
                />
              </ProductLink>
            </li>
          ))}
        </ul>

        <Reveal className="mt-8 flex items-start gap-3 rounded-xl border border-line/70 bg-surface-2/40 p-4">
          <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <p className="muted text-13 leading-relaxed">
            Running from source instead? Every product links its repository on its own page, and each
            carries its own licence and build instructions in its README.
          </p>
        </Reveal>
      </Section>

      <Section id="independence" band>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="flex items-start gap-4 rounded-2xl border border-gold/25 bg-gold-soft/60 p-6">
              <Package className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <h2 className="section-title text-xl">None of these depend on each other</h2>
                <p className="muted mt-3 text-14 leading-relaxed">
                  That is not a slogan, it is an audit. Every manifest in the{' '}
                  <code className="font-mono text-13 text-gold-text">Hilbras</code> organisation was
                  read, and the only cross-reference between them is an internal package inside a
                  single repository. Installing one of these pulls in zero Hilbras dependencies, and
                  the versions above are genuinely independent of one another.
                </p>
                <p className="muted mt-3 text-14 leading-relaxed">
                  <a href={productPath('omnihilbras')} className="text-gold-text underline-offset-4 hover:underline">
                    OmniHilbras
                  </a>{' '}
                  is the exception that proves the rule: its gateway is a multi-surface runtime that
                  speaks to providers, not a wrapper around the other packages here.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
