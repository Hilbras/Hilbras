import { vision, visionCaveat } from '../data/site';
import { Reveal } from './ui/Reveal';
import { Section, SectionHeader } from './ui/Section';

export function Vision() {
  return (
    <Section id="vision" band>
      <SectionHeader id="vision-heading" eyebrow="Long-term vision" title="Not one application. A technology ecosystem." lede={vision.lede} />

      {/* An ordered list on purpose: the stages are the order the layers depend
          on each other, which is the claim the section is making. */}
      <ol className="stagger mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-[color:var(--line)] sm:grid-cols-2 lg:grid-cols-4">
        {vision.stages.map((stage, index) => (
          <Reveal
            key={stage.id}
            as="li"
            className="group relative flex flex-col bg-surface p-5 transition-colors hover:bg-gold-soft/40"
          >
            <span className="mono-label text-gold-text">{String(index + 1).padStart(2, '0')}</span>
            <p className="mt-3 text-[15px] font-semibold tracking-[-0.02em]">{stage.label}</p>
            <p className="muted mt-2 text-xs leading-relaxed">{stage.body}</p>
          </Reveal>
        ))}
      </ol>

      <Reveal className="muted mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed">
        {visionCaveat}
      </Reveal>
    </Section>
  );
}
