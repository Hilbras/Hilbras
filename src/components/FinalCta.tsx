import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { site } from '../data/site';
import { IconAssuranceRow } from './ui/AssuranceRow';
import { GitHubMark } from './ui/GitHubMark';
import { Reveal } from './ui/Reveal';
import { Section } from './ui/Section';

const assurances = [
  { icon: Sparkles, label: 'Actively developed' },
  { icon: Lock, label: 'Your infrastructure, your keys' },
  { icon: ArrowRight, label: 'No bundling required' },
] as const;

export function FinalCta() {
  return (
    <Section id="start">
      <Reveal variant="card" className="card relative overflow-hidden px-6 py-12 text-center sm:px-10 sm:py-16">
        <div aria-hidden="true" className="glow-wash pointer-events-none absolute inset-x-0 -top-32 h-64 opacity-60 blur-3xl" />

        <div className="relative">
          <span className="eyebrow">Start anywhere</span>
          <h2 id="start-heading" className="section-title mx-auto mt-5 max-w-2xl text-balance">
            Build what comes <span className="gold-text">next.</span>
          </h2>
          <p className="muted mx-auto mt-4 max-w-lg text-sm leading-relaxed sm:text-base">
            Explore the Hilbras ecosystem and find the technologies we are building for developers,
            businesses, and creators.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/products" className="btn-gold">
              Explore products
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href={site.organisation.github} className="btn-ghost" target="_blank" rel="noreferrer noopener">
              <GitHubMark />
              Visit GitHub
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <IconAssuranceRow items={assurances} className="mt-7" />
        </div>
      </Reveal>
    </Section>
  );
}
