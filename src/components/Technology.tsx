import { BrainCircuit, Code2, Cpu, Globe, Lock, Users, type LucideIcon } from 'lucide-react';
import { counts, sentence } from '../data/site';
import { areas, type AreaId } from '../data/areas';
import { Reveal } from './ui/Reveal';
import { Section, SectionHeader } from './ui/Section';

/** One entry per area, plus the concrete work that sits inside it. */
const detail: Record<AreaId, { icon: LucideIcon; capabilities: readonly string[] }> = {
  ai: {
    icon: BrainCircuit,
    capabilities: ['Model access and execution', 'Routing and policy', 'Durable memory and context', 'Automation runtimes'],
  },
  'developer-infrastructure': {
    icon: Code2,
    capabilities: ['SDKs and public APIs', 'Authentication and authorization', 'Authoring environments', 'Code collaboration'],
  },
  platforms: {
    icon: Globe,
    capabilities: ['Application runtimes', 'Content and taxonomy', 'Extensions and plugins', 'Publishing workflows'],
  },
  social: {
    icon: Users,
    capabilities: ['Publishing and distribution', 'Review and discussion', 'Community infrastructure', 'Shared project history'],
  },
  computing: {
    icon: Cpu,
    capabilities: ['Operating systems', 'Desktop shell and services', 'Native applications', 'Developer workspaces'],
  },
  security: {
    icon: Lock,
    capabilities: ['Software analysis', 'Target and asset discovery', 'Verification and evidence', 'Reporting'],
  },
};

export function Technology() {
  return (
    <Section id="technology">
      <SectionHeader
        id="technology-heading"
        eyebrow="Technology areas"
        title="What Hilbras actually builds."
        lede={`${sentence(counts.areas)} areas, described in terms of the work rather than the product name. Most projects in the ecosystem live in more than one of them.`}
      />

      <ul className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const { icon: Icon, capabilities } = detail[area.id];
          return (
            <Reveal key={area.id} as="li" variant="card" className="h-full">
              <article className="card group relative flex h-full flex-col overflow-hidden p-6">
                <div className="mb-7 flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/25 bg-gold-soft text-gold-text">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mono-label transition-colors group-hover:text-gold-text">{area.short}</span>
                </div>

                <h3 className="text-lg font-semibold tracking-[-0.02em]">{area.name}</h3>
                <p className="muted mt-2.5 mb-6 text-sm leading-relaxed">{area.summary}</p>

                <ul className="mt-auto space-y-2 border-t border-line pt-4">
                  {capabilities.map((capability) => (
                    <li key={capability} className="muted flex items-start gap-2 text-[12px] leading-relaxed">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                      {capability}
                    </li>
                  ))}
                </ul>

                <div className="card-glow" aria-hidden="true" />
              </article>
            </Reveal>
          );
        })}
      </ul>

      <Reveal className="muted mt-8 text-center text-sm">
        A new product usually lands in two or three of these at once.
      </Reveal>
    </Section>
  );
}
