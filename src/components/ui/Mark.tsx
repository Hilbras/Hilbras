import { markShapes, type MarkShape } from '../../data/marks';

export type { MarkId } from '../../data/marks';

/** One shape from the marks table, drawn with the shared stroke. */
function Shape({ shape }: { shape: MarkShape }) {
  switch (shape.shape) {
    case 'path':
      return <path d={shape.d} />;
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />;
    case 'rect':
      return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />;
  }
}

/**
 * A product's mark, drawn from `src/data/marks.ts`.
 *
 * This component holds no identity of its own — it is a renderer over a data
 * table. That is deliberate: the marks used to be JSX here, with the `MarkId`
 * union beside them, which meant a new mark required editing this file and
 * putting the data layer in a component's dependency graph. Now adding a mark is
 * a data edit, and `validation.ts` refuses a product naming one that nobody drew.
 */
export function Mark({ id, className = 'h-4 w-4' }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {markShapes(id).map((shape, index) => (
        <Shape key={index} shape={shape} />
      ))}
    </svg>
  );
}

/** The company mark. Same grid, same stroke, so it sits next to any product. */
export function HilbrasMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M12 2 17 8.5 12 22 7 8.5 12 2Z" fill="currentColor" />
      <path d="M12 2 14 9.5 12 22 10 9.5 12 2Z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
