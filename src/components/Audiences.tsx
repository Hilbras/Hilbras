import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { audiences, counts, sentence } from '../data/site';
import { Reveal } from './ui/Reveal';
import { Section, SectionHeader } from './ui/Section';

export function Audiences() {
  return (
    <Section id="built-for" band>
      <SectionHeader
        id="built-for-heading"
        eyebrow="Built for"
        title={`${sentence(counts.audiences)} audiences, three different entry points.`}
        lede="You should be able to find the part of Hilbras that matters to you without reading the other two."
      />

      <ul className="stagger mt-10 grid gap-4 md:grid-cols-3">
        {audiences.map((audience) => (
          <Reveal key={audience.id} as="li" variant="card" className="h-full">
            <article className="card group relative flex h-full flex-col overflow-hidden p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-[-0.02em]">{audience.title}</h3>
              <p className="mt-3 text-sm leading-relaxed font-medium">{audience.lede}</p>
              <p className="muted mt-3 text-sm leading-relaxed">{audience.body}</p>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-4">
                {audience.points.map((point) => (
                  <li key={point} className="muted flex items-start gap-2.5 text-[12px] leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>

              <a href={audience.cta.href} className="btn-quiet mt-6 -ml-2.5 self-start text-gold-text">
                {audience.cta.label}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <div className="card-glow" aria-hidden="true" />
            </article>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
