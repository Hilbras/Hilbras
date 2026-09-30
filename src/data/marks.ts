/**
 * Product identity as geometry.
 *
 * This used to be JSX in `src/components/ui/Mark.tsx`, with the `MarkId` union
 * declared beside it. That put the data layer in a component's dependency graph
 * — `areas.ts` had to `import type { MarkId } from '../components/ui/Mark'` —
 * and it made "adding a product is a data edit" false: a new mark could not be
 * added without editing a component, because the union of ids lived there.
 *
 * A mark is data, so it lives with the data. `Mark` is now a pure renderer over
 * this table, and `MarkId` is derived from the table's own keys, so adding a mark
 * here widens the type automatically and nothing else has to be told.
 *
 * Everything is drawn on one 24-unit grid with a 1.4 stroke and round caps, so
 * any mark sits correctly beside any other. These were Unicode glyphs once, which
 * meant every mark was drawn by whatever system font owned the codepoint: the
 * same product looked different on macOS, Windows and Linux, and a missing glyph
 * rendered as tofu.
 */

export type MarkShape =
  | { shape: 'path'; d: string }
  | { shape: 'circle'; cx: number; cy: number; r: number }
  | { shape: 'rect'; x: number; y: number; width: number; height: number; rx?: number };

export const marks = {
  // A diamond within a diamond.
  diamond: [
    { shape: 'path', d: 'M12 2.75 21.25 12 12 21.25 2.75 12Z' },
    { shape: 'path', d: 'M12 7.5 16.5 12 12 16.5 7.5 12Z' },
  ],
  // Concentric rings: something retained outside the context window.
  memory: [
    { shape: 'circle', cx: 12, cy: 12, r: 8.5 },
    { shape: 'circle', cx: 12, cy: 12, r: 3.75 },
  ],
  // A single load-bearing block.
  keystone: [{ shape: 'path', d: 'M12 2.75 20.5 7.4v9.2L12 21.25 3.5 16.6V7.4Z' }],
  // A page with content rules.
  panel: [
    { shape: 'rect', x: 3.25, y: 3.25, width: 17.5, height: 17.5, rx: 2.5 },
    { shape: 'path', d: 'M6.75 8.25h10.5M6.75 12h10.5M6.75 15.75h6.5' },
  ],
  // Aiming point.
  target: [
    { shape: 'circle', cx: 12, cy: 12, r: 8.5 },
    { shape: 'circle', cx: 12, cy: 12, r: 3.75 },
    { shape: 'path', d: 'M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5' },
  ],
  // An open hexagon: the edge in front of every provider.
  portal: [
    { shape: 'path', d: 'M12 2.75 20.5 7.4v9.2L12 21.25 3.5 16.6V7.4Z' },
    { shape: 'path', d: 'M12 9.25 15.5 11.25v4L12 17.25 8.5 15.25v-4Z' },
  ],
  // The routing diamond.
  prism: [{ shape: 'path', d: 'M12 2.75 21.25 12 12 21.25 2.75 12Z' }],
  // A four-pane desktop.
  desktop: [
    { shape: 'rect', x: 2.75, y: 4.25, width: 18.5, height: 15.5, rx: 2.25 },
    { shape: 'path', d: 'M12 4.25v15.5M2.75 12h18.5' },
  ],
  // A prompt and a caret.
  terminal: [
    { shape: 'path', d: 'M7.5 7.5 3.75 12 7.5 16.5' },
    { shape: 'path', d: 'M16.5 7.5 20.25 12 16.5 16.5' },
    { shape: 'path', d: 'M13.75 5.5 10.25 18.5' },
  ],
  // Two revisions, one of them branched.
  branches: [
    { shape: 'rect', x: 3, y: 3, width: 12, height: 12, rx: 2 },
    { shape: 'path', d: 'M9 9h9.75a2.25 2.25 0 0 1 2.25 2.25V18' },
  ],
  // A scanned perimeter.
  shield: [{ shape: 'path', d: 'M12 2.75 20 6.4v5.85c0 4.3-3.3 7.6-8 9-4.7-1.4-8-4.7-8-9V6.4Z' }]
} as const satisfies Record<string, readonly MarkShape[]>;

/**
 * The set of mark ids, derived from the table above.
 *
 * `keyof typeof marks` rather than a hand-written union, so a mark added to the
 * table is immediately a valid `mark:` value with no second edit. The compiler
 * still rejects a product that names a mark nobody drew — which is the check
 * worth having, since an unknown mark used to render as a silently empty box.
 */
export type MarkId = keyof typeof marks;

export const markIds = Object.keys(marks) as readonly MarkId[];

/** The shapes for a mark, or an empty list for one that does not exist. */
export function markShapes(id: string): readonly MarkShape[] {
  return (marks as Record<string, readonly MarkShape[]>)[id] ?? [];
}
