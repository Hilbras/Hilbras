import { areas, productsInArea } from '../data/areas';
import { counts, sentence } from '../data/site';
import { Mark } from './ui/Mark';
import { ProductLink } from './ui/ProductLink';
import { Reveal } from './ui/Reveal';
import { Section, SectionHeader } from './ui/Section';

export function Ecosystem() {
  return (
    <Section id="ecosystem" band>
      <SectionHeader
        id="ecosystem-heading"
        eyebrow="The Hilbras ecosystem"
        title={`${sentence(counts.areas)} areas. One company.`}
        lede="The ecosystem is organised by what the technology does, not by when it shipped. A product can sit in more than one area — that is usually the interesting part."
      />

      <div className="stagger mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const owned = productsInArea(area.id);
          return (
            <Reveal key={area.id} variant="card" className="card group relative flex flex-col overflow-hidden p-6">
              <div className="mb-7 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-card">{area.name}</h3>
                <span className="mono-label shrink-0 transition-colors group-hover:text-gold-text">
                  {owned.length} {owned.length === 1 ? 'product' : 'products'}
                </span>
              </div>

              <p className="muted mb-6 text-sm leading-relaxed">{area.detail}</p>

              <ul className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
                {owned.map((product) => (
                  <li key={`${area.id}-${product.id}`}>
                    <ProductLink
                      product={product}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2/60 px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-gold/50 hover:bg-gold-soft hover:text-gold-text"
                    >
                      <Mark id={product.mark} className="h-3.5 w-3.5 shrink-0 text-gold" />
                      {product.name}
                    </ProductLink>
                  </li>
                ))}
              </ul>

              <div className="card-glow" aria-hidden="true" />
            </Reveal>
          );
        })}
      </div>

      <Reveal className="muted mt-8 text-center text-sm">
        Areas overlap on purpose. HilGit is a collaboration product, a social product, and a developer tool.
      </Reveal>
    </Section>
  );
}
