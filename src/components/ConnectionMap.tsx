import { areas, productById } from '../data/areas';
import { Mark } from './ui/Mark';
import { ProductLink } from './ui/ProductLink';
import { Reveal } from './ui/Reveal';
import { Section, SectionHeader } from './ui/Section';

type Stage = {
  id: string;
  label: string;
  /** Product ids rendered as nodes in this band. */
  products: readonly string[];
  note: string;
};

/**
 * A conceptual map of the company, not a dependency graph. Bands are ordered by
 * how foundational the work is, which is the same order the vision section uses.
 */
const stages: readonly Stage[] = [
  {
    id: 'foundation',
    label: 'Foundation',
    products: ['keystone'],
    note: 'Identity, access, and the audit trail everything else assumes.',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    products: ['sdk', 'gateway', 'omnihilbras', 'remembera'],
    note: 'Reaching models, controlling the route, and keeping what matters.',
  },
  {
    id: 'application',
    label: 'Application',
    products: ['hilpress', 'studio', 'code', 'hilgit'],
    note: 'Runtimes, automation, authoring, and collaboration.',
  },
  {
    id: 'environment',
    label: 'Environment',
    products: ['os', 'spectra'],
    note: 'The computing surface, and the tooling that inspects it.',
  },
] as const;

function StageNodes({ stage }: { stage: Stage }) {
  return (
    /* Always four tracks: a band with one product occupies one cell rather than
       stretching, so every node on the page keeps the same size. */
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stage.products.map((id) => {
        const product = productById.get(id);
        if (!product) return null;
        const area = areas.find((entry) => entry.id === product.area);
        return (
          <li key={`${stage.id}-${id}`}>
            <ProductLink product={product} className="node flex h-full flex-col gap-1.5 px-3 py-3">
              <span className="flex items-center gap-2">
                <Mark id={product.mark} className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate text-13 font-medium">{product.name}</span>
              </span>
              <span className="muted truncate text-2xs">{area ? area.short : 'Hilbras'}</span>
            </ProductLink>
          </li>
        );
      })}
    </ul>
  );
}

function StageBand({ stage, index }: { stage: Stage; index: number }) {
  return (
    <div>
      {index > 0 ? (
        /* The connector shares the second grid column with the nodes, so it
           lines up with the left edge of the product grid at every width. */
        <div aria-hidden="true" className="grid grid-cols-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <span className="flow-line hidden h-8 w-px sm:block" />
          <span className="flex items-center gap-3 sm:pl-4">
            <span className="flow-travel h-1.5 w-1.5 rounded-full bg-gold" />
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
        <div>
          <p className="mono-label">
            <span className="mr-2 text-gold-text">{String(index + 1).padStart(2, '0')}</span>
            {stage.label}
          </p>
          <p className="muted mt-2 text-xs leading-relaxed">{stage.note}</p>
        </div>
        <StageNodes stage={stage} />
      </div>
    </div>
  );
}

export function ConnectionMap() {
  return (
    <Section id="connect" band>
      <SectionHeader
        id="connect-heading"
        eyebrow="How everything connects"
        title="Independent by default. Stronger by choice."
        lede="Read this as an ordering of the work, not a set of dependencies. Every box is useful on its own. Connecting two of them is where the extra value appears."
      />

      <div className="stagger mt-12">
        {stages.map((stage, index) => (
          <Reveal key={stage.id}>
            <StageBand stage={stage} index={index} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-gold/25 bg-gold-soft/60 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <p className="text-sm font-semibold">A connected product is still a standalone product.</p>
        <p className="muted max-w-md text-xs leading-relaxed">
          If you only ever install one thing from this list, the diagram still holds. It is a map of where
          value can be added, not a list of things you are required to install.
        </p>
      </Reveal>
    </Section>
  );
}
