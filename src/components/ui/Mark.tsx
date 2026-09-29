import type { ReactNode } from 'react';

export type MarkId =
  | 'diamond'
  | 'memory'
  | 'keystone'
  | 'panel'
  | 'target'
  | 'portal'
  | 'prism'
  | 'desktop'
  | 'terminal'
  | 'branches'
  | 'shield';

/**
 * Product identity as geometry rather than as a character.
 *
 * These used to be Unicode glyphs, which meant every mark was drawn by whatever
 * system font happened to own the codepoint — the same product looked different
 * on macOS, Windows, and Linux, and a missing glyph rendered as tofu. Inline SVG
 * in one 24-unit grid fixes the weight and the alignment, inherits the gold
 * token, and costs no extra request.
 */
const marks: Record<MarkId, ReactNode> = {
  // A diamond within a diamond.
  diamond: (
    <>
      <path d="M12 2.75 21.25 12 12 21.25 2.75 12Z" />
      <path d="M12 7.5 16.5 12 12 16.5 7.5 12Z" />
    </>
  ),
  // Concentric rings: something retained outside the context window.
  memory: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.75" />
    </>
  ),
  // A single load-bearing block.
  keystone: <path d="M12 2.75 20.5 7.4v9.2L12 21.25 3.5 16.6V7.4Z" />,
  // A page with content rules.
  panel: (
    <>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="2.5" />
      <path d="M6.75 8.25h10.5M6.75 12h10.5M6.75 15.75h6.5" />
    </>
  ),
  // Aiming point.
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5" />
    </>
  ),
  // An open hexagon: the edge in front of every provider.
  portal: (
    <>
      <path d="M12 2.75 20.5 7.4v9.2L12 21.25 3.5 16.6V7.4Z" />
      <path d="M12 9.25 15.5 11.25v4L12 17.25 8.5 15.25v-4Z" />
    </>
  ),
  // The routing diamond.
  prism: <path d="M12 2.75 21.25 12 12 21.25 2.75 12Z" />,
  // A four-pane desktop.
  desktop: (
    <>
      <rect x="2.75" y="4.25" width="18.5" height="15.5" rx="2.25" />
      <path d="M12 4.25v15.5M2.75 12h18.5" />
    </>
  ),
  // A prompt and a caret.
  terminal: (
    <>
      <path d="M7.5 7.5 3.75 12 7.5 16.5" />
      <path d="M16.5 7.5 20.25 12 16.5 16.5" />
      <path d="M13.75 5.5 10.25 18.5" />
    </>
  ),
  // Two revisions, one of them branched.
  branches: (
    <>
      <rect x="3" y="3" width="12" height="12" rx="2" />
      <path d="M9 9h9.75a2.25 2.25 0 0 1 2.25 2.25V18" />
    </>
  ),
  // A scanned perimeter.
  shield: <path d="M12 2.75 20 6.4v5.85c0 4.3-3.3 7.6-8 9-4.7-1.4-8-4.7-8-9V6.4Z" />,
};

export function Mark({ id, className = 'h-4 w-4' }: { id: MarkId; className?: string }) {
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
      {marks[id]}
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
