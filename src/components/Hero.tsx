import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { areas } from "@/data/areas";
import { counts, heroAssurances, site, spell } from "@/data/site";
import { GitHubMark } from "@/components/ui/GitHubMark";
import { AssuranceRow } from "@/components/ui/AssuranceRow";
import { HilbrasMark, Mark } from "@/components/ui/Mark";

const areaSentence = areas
  .map((area) => area.name)
  .reduce((list, name, index) =>
    index === 0 ? name : index === areas.length - 1 ? `${list}, and ${name}` : `${list}, ${name}`,
  );

export function Hero() {
  return (
    <section id="intro" aria-labelledby="intro-heading" className="relative overflow-hidden border-b border-line/70">
      <div aria-hidden="true" className="bg-glow absolute inset-x-0 top-0 h-[620px] opacity-70" />
      <div aria-hidden="true" className="grid-wash absolute inset-x-0 top-0 h-[620px] opacity-35" />

      <div className="shell relative pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="text-center">
          <span className="eyebrow hero-in hero-in-1">
            <span className="eyebrow-dot" aria-hidden="true" />
            An independent technology company
          </span>

          <h1 id="intro-heading" className="display-title hero-in hero-in-2 mx-auto mt-6 max-w-4xl text-balance">
            Build. Connect. <span className="gold-text">Create.</span>
          </h1>

          <p className="muted hero-in hero-in-3 mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
            Building across {areaSentence}.
          </p>

          <div className="hero-in hero-in-4 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/#ecosystem" className="btn-gold">
              Explore the ecosystem
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={site.organisation.github}
              className="btn-ghost"
              target="_blank"
              rel="noreferrer noopener"
            >
              <GitHubMark />
              Explore GitHub
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>

          <AssuranceRow labels={heroAssurances} className="hero-in hero-in-5 mt-7" />
        </div>

        <div className="hero-in hero-in-panel mx-auto mt-14 max-w-4xl sm:mt-20">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:flex-nowrap sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold-soft text-gold-text">
                  <HilbrasMark className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-11 font-medium tracking-wide">hilbras / ecosystem</p>
                  <p className="muted mt-0.5 text-2xs">
                    {spell(counts.areas)} technology areas · {spell(counts.products)} products
                  </p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold/30 bg-gold-soft px-2.5 py-1 font-mono text-2xs text-gold-text">
                <span className="soft-pulse h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                in progress
              </span>
            </div>

            <ul className="grid gap-px bg-[color:var(--line)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {areas.map((area) => (
                <li key={area.id} className="flex items-center gap-2.5 bg-surface px-4 py-4 sm:px-5">
                  <Mark id={area.mark} className="h-4 w-4 shrink-0 text-gold" />
                  <span className="text-13 leading-tight font-medium">{area.short}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-4 py-3 sm:px-5">
              <p className="muted text-11">
                Every product stands on its own. The connections are an option, not a requirement.
              </p>
              <Link href="/#connect" className="btn-quiet !px-2 !py-1 text-11 text-gold-text">
                See how it connects
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="hairline" />
    </section>
  );
}
