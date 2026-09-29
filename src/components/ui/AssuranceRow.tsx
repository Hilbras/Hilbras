import type { ComponentType } from 'react';
import { CheckCircle2 } from 'lucide-react';

type Assurance = {
  icon: ComponentType<{ className?: string }>;
  label: string;
};

const base =
  'muted flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-2xs tracking-claim uppercase';

function AssuranceItem({ icon: Icon, label }: Assurance) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-gold" aria-hidden="true" />
      {label}
    </span>
  );
}

/** The hero's list: a fixed check beside each claim. */
export function AssuranceRow({ labels, className = '' }: { labels: readonly string[]; className?: string }) {
  return (
    <p className={`${base} ${className}`.trim()}>
      {labels.map((label) => (
        <AssuranceItem key={label} icon={CheckCircle2} label={label} />
      ))}
    </p>
  );
}

/** The closing list, where each claim gets its own icon. */
export function IconAssuranceRow({ items, className = '' }: { items: readonly Assurance[]; className?: string }) {
  return (
    <p className={`${base} ${className}`.trim()}>
      {items.map((item) => (
        <AssuranceItem key={item.label} {...item} />
      ))}
    </p>
  );
}
