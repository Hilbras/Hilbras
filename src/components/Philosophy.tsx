import Link from "next/link";
import { counts, principles, sentence } from "@/data/site";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";

export function Philosophy() {
  return (
    <Section id="philosophy">
      <SectionHeader
        id="philosophy-heading"
        eyebrow="Our philosophy"
        title={`${sentence(counts.principles)} commitments we can be held to.`}
        lede="Not slogans. These are the rules we use to decide whether a Hilbras project is finished."
      />

      <ol className="stagger mt-10 border-t border-line">
        {principles.map((principle) => (
          <Reveal
            key={principle.id}
            as="li"
            className="group grid gap-2 border-b border-line py-6 transition-colors hover:bg-gold-soft/30 sm:grid-cols-[3rem_15rem_1fr] sm:items-baseline sm:gap-6 sm:px-3"
          >
            <span className="font-mono text-xl font-bold text-gold/75" aria-hidden="true">
              {principle.number}
            </span>
            <h3 className="text-base font-semibold tracking-card sm:text-lg">{principle.title}</h3>
            <p className="muted text-sm leading-relaxed">{principle.body}</p>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-8 text-center">
        <Link href="/#connect" className="btn-quiet text-gold-text">
          See these principles in the architecture
          <span aria-hidden="true">→</span>
        </Link>
      </Reveal>
    </Section>
  );
}
