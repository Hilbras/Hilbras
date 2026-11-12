import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type SectionProps = {
  id: string;
  band?: boolean;
  className?: string;
  children: ReactNode;
};

export function Section({ id, band, className = "", children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${band ? "section-band" : ""} ${className}`.trim()}
    >
      <div className="shell section-pad">{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  id: string;
};

export function SectionHeader({ eyebrow, title, lede, id }: SectionHeaderProps) {
  return (
    <Reveal className="text-center">
      <span className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 id={id} className="section-title mt-5 text-balance">
        {title}
      </h2>
      {lede ? (
        <p className="muted mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base">{lede}</p>
      ) : null}
    </Reveal>
  );
}
