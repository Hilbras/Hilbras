import { statusLabels, type ProductStatus } from '../../data/areas';

const statusClass: Record<ProductStatus, string> = {
  stable: 'border-success/25 bg-success/10 text-success',
  beta: 'border-gold/35 bg-gold-soft text-gold-text',
  alpha: 'border-line-strong bg-surface-2 text-muted',
  building: 'border-dashed border-line-strong bg-transparent text-muted',
};

type StatusPillProps = {
  status: ProductStatus;
  /**
   * The dense form used where a full pill would crowd the layout — the
   * navigation dropdown. Exists so the label has one source; the component
   * used to expose `statusLabels` directly and the navbar read it separately.
   */
  compact?: boolean;
};

/**
 * Status is stated, never implied. A product without a public release says so
 * on its card rather than linking nowhere.
 *
 * The four levels are ordered by how much a reader should rely on them, and the
 * styling follows that order: solid green for stable, gold for beta, a filled
 * neutral for alpha, and a dashed outline for a product still being built.
 */
export function StatusPill({ status, compact }: StatusPillProps) {
  if (compact) {
    return (
      <span className="ml-auto shrink-0 font-mono text-[9px] tracking-[0.08em] text-muted uppercase">
        {statusLabels[status]}
      </span>
    );
  }

  return (
    <span
      data-status={status}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase ${statusClass[status]}`}
    >
      {status === 'stable' ? (
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
      ) : null}
      {statusLabels[status]}
    </span>
  );
}
