import { statusDefinitions, statusLabels, type ProductStatus } from "@/data/areas";

const statusClass: Record<ProductStatus, string> = {
  stable: "border-success/25 bg-success/10 text-success",
  beta: "border-gold/35 bg-gold-soft text-gold-text",
  alpha: "border-line-strong bg-surface-2 text-muted",
  building: "border-dashed border-line-strong bg-transparent text-muted",
};

type StatusPillProps = {
  status: ProductStatus;
  compact?: boolean;
};

export function StatusPill({ status, compact }: StatusPillProps) {
  if (compact) {
    return (
      <span className="ml-auto shrink-0 font-mono text-9 tracking-label text-muted uppercase">
        {statusLabels[status]}
      </span>
    );
  }

  return (
    <span
      data-status={status}
      title={statusDefinitions[status]}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-2xs tracking-label uppercase ${statusClass[status]}`}
    >
      {status === "stable" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
      ) : null}
      {statusLabels[status]}
    </span>
  );
}
