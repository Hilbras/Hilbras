import { Link } from 'lucide-react';
import { areas, products } from '../data/areas';
import { counts } from '../data/site';
import { productPath } from '../routes';
import { Mark } from '../components/ui/Mark';
import { StatusPill } from '../components/ui/StatusPill';
import { Reveal } from '../components/ui/Reveal';

/**
 * The product index.
 *
 * The homepage stays a company page — the roadmap is explicit that it should not
 * grow into a catalogue — so the full list lives here, grouped by the same
 * taxonomy the rest of the site uses. Every product appears, including the three
 * with nothing public, because "what Hilbras is building" is a fair question and
 * hiding the answer would misrepresent the company.
 *
 * Each product is listed once, under the area that owns it. A product
 * belonging to two areas used to be listed under both, which made the page
 * announce eleven products and then show sixteen entries — so a reader counting
 * them got a different number from the one the page states, and a product in two
 * areas looked like two products. The other areas are named beside it instead,
 * which says the same thing without the counting problem.
 *
 * The grouping key is `product.area`, not "the first area that lists it". The
 * model already documents that field as the area that owns the product, and
 * validation checks it is one of the areas that list it. Deriving ownership
 * from list order instead meant the social-technology section came out empty,
 * because all three of its products are claimed earlier in the list.
 */
export function ProductIndexPage() {
  return (
    <>
      <section aria-labelledby="index-heading" className="relative overflow-hidden border-b border-line/70">
        <div aria-hidden="true" className="bg-glow absolute inset-x-0 top-0 h-[420px] opacity-60" />

        <div className="shell relative pb-14 pt-14 text-center sm:pb-20 sm:pt-20">
          <Reveal>
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              The ecosystem
            </span>
          </Reveal>
          <Reveal className="mt-6">
            <h1 id="index-heading" className="display-title text-4xl sm:text-5xl">
              Every Hilbras product
            </h1>
          </Reveal>
          <Reveal className="mt-5">
            <p className="muted mx-auto max-w-2xl text-base leading-relaxed">
              {counts.products} products across {counts.areas} technology areas, listed by what the
              technology does rather than by when it shipped. {counts.public} of them are public today.
            </p>
          </Reveal>
        </div>
      </section>

      {areas.map((area) => {
        const areaProducts = products.filter((product) => product.area === area.id);
        if (areaProducts.length === 0) return null;

        return (
          <section key={area.id} aria-labelledby={`area-${area.id}`} className="border-b border-line/70">
            <div className="shell section-pad">
              <Reveal className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h2 id={`area-${area.id}`} className="section-title text-xl sm:text-2xl">
                  {area.name}
                </h2>
                <p className="muted text-sm">{area.summary}</p>
              </Reveal>

              <Reveal className="mt-7">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {areaProducts.map((product) => {
                    const alsoIn = areas
                      .filter((other) => other.id !== area.id && other.products.includes(product.id))
                      .map((other) => other.name);

                    return (
                      <li key={product.id} className="min-w-0">
                        <a
                          href={productPath(product.id)}
                          className="card group flex h-full items-start gap-3.5 p-4 transition-colors hover:border-gold/40"
                        >
                          <Mark id={product.mark} className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-15 font-medium">{product.name}</span>
                              <StatusPill status={product.status} compact />
                            </span>
                            <span className="muted mt-1 block text-13 leading-relaxed">
                              {product.summary}
                            </span>
                            {alsoIn.length > 0 ? (
                              <span className="mt-2 block text-xs text-muted opacity-80">
                                Also in {alsoIn.join(', ')}
                              </span>
                            ) : null}
                            {!product.repository && !product.href ? (
                              <span className="mt-2 block text-xs text-muted opacity-80">
                                No public release yet
                              </span>
                            ) : null}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            </div>
          </section>
        );
      })}

      <section aria-labelledby="index-next" className="section-band">
        <div className="shell section-pad text-center">
          <Reveal>
            <h2 id="index-next" className="section-title text-2xl">
              How they fit together
            </h2>
            <p className="muted mx-auto mt-4 max-w-xl text-sm leading-relaxed">
              Each product stands on its own. Where two of them are worth connecting, the connection is a
              choice rather than a requirement.
            </p>
            <a href="/#connect" className="btn-ghost mt-7">
              <Link className="h-4 w-4" aria-hidden="true" />
              See the connection map
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
