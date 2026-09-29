import { Mark, type MarkId } from './Mark';

type ProductMarkProps = {
  mark: MarkId;
  name: string;
  className?: string;
  /** Size of the glyph inside the chip. */
  glyph?: string;
};

/**
 * The chip every product identity sits in. Nothing to download, nothing to
 * lazy-load, and it inherits the gold treatment so every mark reads as Hilbras.
 */
export function ProductMark({ mark, name, className = 'h-10 w-10', glyph = 'h-5 w-5' }: ProductMarkProps) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold-soft text-gold-text ${className}`}
    >
      <Mark id={mark} className={glyph} />
      <span className="sr-only">{name}</span>
    </span>
  );
}
