import { statusLabels, type ProductStatus } from '../../data/areas';

const statusClass: Record<ProductStatus, string> = {
  stable: 'border-success/25 bg-success/10 text-success',
  beta: 'border-gold/35 bg-gold-soft text-gold-text',
  alpha: 'border-line-strong bg-surface-2 text-muted',
  building: 'border-dashed border-line-strong bg-transparent text-muted',
};

/**
 * Status is stated, never implied. A product without a public home says so.
 */
export function StatusPill({ status }: { status: ProductStatus }) {
  return (
    <span
      data-status={status}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase ${statusClass[status]}`}
    >
      {status === 'stable' ? (
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
      ) : null}
      {statusLabels[status]}
    </span>
  );
}
