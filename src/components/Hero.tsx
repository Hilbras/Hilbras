import { ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { areas } from '../data/areas';
import { heroAssurances, site } from '../data/site';
import { GitHubMark } from './ui/GitHubMark';
import { HilbrasMark, Mark } from './ui/Mark';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line/70">
      <div aria-hidden="true" className="bg-glow absolute inset-x-0 top-0 h-[620px] opacity-70" />
      <div aria-hidden="true" className="grid-wash absolute inset-x-0 top-0 h-[620px] opacity-35" />

      <div className="shell relative pb-16 pt-16 sm:pb-24 sm:pt-24">
        {/* The hero plays on load rather than on scroll, so it uses an
            animation instead of the scroll-reveal transition. */}
        <div className="text-center">
          <span className="eyebrow hero-in hero-in-1">
            <span className="eyebrow-dot" aria-hidden="true" />
            An independent technology company
          </span>

          <h1 className="display-title hero-in hero-in-2 mx-auto mt-6 max-w-4xl text-balance">
            Build. Connect. <span className="gold-text">Create.</span>
          </h1>

          <p className="muted hero-in hero-in-3 mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
            Hilbras builds modern software infrastructure, developer tools, AI systems, and digital platforms
            for the next generation of the web.
          </p>

          <div className="hero-in hero-in-4 mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#ecosystem" className="btn-gold">
              Explore the ecosystem
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href={site.organisation.github} className="btn-ghost" target="_blank" rel="noreferrer noopener">
              <GitHubMark />
              Explore GitHub
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <p className="muted hero-in hero-in-5 mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.12em] uppercase">
            {heroAssurances.map((assurance) => (
              <span key={assurance} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-gold" aria-hidden="true" />
                {assurance}
              </span>
            ))}
          </p>
        </div>

        <div className="hero-in hero-in-panel mx-auto mt-14 max-w-4xl sm:mt-20">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:flex-nowrap sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold-soft text-gold-text">
                  <HilbrasMark className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-medium tracking-wide">hilbras / ecosystem</p>
                  <p className="muted mt-0.5 text-[10px]">six technology areas · eleven products</p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold/30 bg-gold-soft px-2.5 py-1 font-mono text-[10px] text-gold-text">
                <span className="soft-pulse h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                in progress
              </span>
            </div>

            {/* Gap-as-divider: the 1px background shows through every grid gap,
                so the rules stay correct at any column count. */}
            <ul className="grid gap-px bg-[color:var(--line)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {areas.map((area) => (
                <li key={area.id} className="flex items-center gap-2.5 bg-surface px-4 py-4 sm:px-5">
                  <Mark id={area.mark} className="h-4 w-4 shrink-0 text-gold" />
                  <span className="text-[13px] leading-tight font-medium">{area.short}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-4 py-3 sm:px-5">
              <p className="muted text-[11px]">
                Every product stands on its own. The connections are an option, not a requirement.
              </p>
              <a href="#connect" className="btn-quiet !px-2 !py-1 text-[11px] text-gold-text">
                See how it connects
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="hairline" />
    </section>
  );
}
