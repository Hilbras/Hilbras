import { Box, Puzzle } from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { Section, SectionHeader } from './ui/Section';

const points = [
  {
    icon: Box,
    title: 'Build powerful products independently.',
    body: 'Each project is designed to be worth installing on its own, with a clear job and a maintainable surface.',
  },
  {
    icon: Puzzle,
    title: 'Connect them when it creates more value.',
    body: 'Shared identity, shared routing, shared memory. Integration is a bonus you can take, not a dependency you inherit.',
  },
] as const;

export function About() {
  return (
    <Section id="about">
      <SectionHeader
        id="about-heading"
        eyebrow="What is Hilbras"
        title="A technology company, not a single product."
        lede="Hilbras is an independent company building software products and infrastructure across several areas of modern computing. Some of them are infrastructure you install. Some of them are applications you use. They share a company, not a runtime."
      />

      <div className="stagger mt-10 grid gap-4 md:grid-cols-2">
        {points.map(({ icon: Icon, title, body }) => (
          <Reveal key={title} variant="card" className="card group relative overflow-hidden p-6 sm:p-7">
            <div className="mb-7 flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/25 bg-gold-soft text-gold-text">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="mono-label transition-colors group-hover:text-gold-text">Principle</span>
            </div>
            <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
            <p className="muted mt-3 text-sm leading-relaxed">{body}</p>
            <div className="card-glow" aria-hidden="true" />
          </Reveal>
        ))}
      </div>

      <Reveal className="muted mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed">
        New products arrive on their own schedules. Nothing on this page requires a second one to work.
      </Reveal>
    </Section>
  );
}
