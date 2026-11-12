export type MarkShape =
  | { shape: "path"; d: string }
  | { shape: "circle"; cx: number; cy: number; r: number }
  | { shape: "rect"; x: number; y: number; width: number; height: number; rx?: number };

export const marks = {
  diamond: [
    { shape: "path", d: "M12 2.75 21.25 12 12 21.25 2.75 12Z" },
    { shape: "path", d: "M12 7.5 16.5 12 12 16.5 7.5 12Z" },
  ],
  memory: [
    { shape: "circle", cx: 12, cy: 12, r: 8.5 },
    { shape: "circle", cx: 12, cy: 12, r: 3.75 },
  ],
  keystone: [{ shape: "path", d: "M12 2.75 20.5 7.4v9.2L12 21.25 3.5 16.6V7.4Z" }],
  panel: [
    { shape: "rect", x: 3.25, y: 3.25, width: 17.5, height: 17.5, rx: 2.5 },
    { shape: "path", d: "M6.75 8.25h10.5M6.75 12h10.5M6.75 15.75h6.5" },
  ],
  target: [
    { shape: "circle", cx: 12, cy: 12, r: 8.5 },
    { shape: "circle", cx: 12, cy: 12, r: 3.75 },
    { shape: "path", d: "M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5" },
  ],
  portal: [
    { shape: "path", d: "M12 2.75 20.5 7.4v9.2L12 21.25 3.5 16.6V7.4Z" },
    { shape: "path", d: "M12 9.25 15.5 11.25v4L12 17.25 8.5 15.25v-4Z" },
  ],
  prism: [{ shape: "path", d: "M12 2.75 21.25 12 12 21.25 2.75 12Z" }],
  shield: [{ shape: "path", d: "M12 2.75 20 6.4v5.85c0 4.3-3.3 7.6-8 9-4.7-1.4-8-4.7-8-9V6.4Z" }],
  network: [
    { shape: "circle", cx: 12, cy: 12, r: 3.25 },
    { shape: "circle", cx: 12, cy: 3.75, r: 1.75 },
    { shape: "circle", cx: 4.5, cy: 18.25, r: 1.75 },
    { shape: "circle", cx: 19.5, cy: 18.25, r: 1.75 },
    { shape: "path", d: "M12 5.5v3.25M9.6 14l-3.7 2.9M14.4 14l3.7 2.9" },
  ],
  kernel: [
    { shape: "rect", x: 8.75, y: 8.75, width: 6.5, height: 6.5, rx: 1.5 },
    { shape: "rect", x: 2.75, y: 2.75, width: 4.5, height: 4.5, rx: 1 },
    { shape: "rect", x: 16.75, y: 2.75, width: 4.5, height: 4.5, rx: 1 },
    { shape: "rect", x: 2.75, y: 16.75, width: 4.5, height: 4.5, rx: 1 },
    { shape: "rect", x: 16.75, y: 16.75, width: 4.5, height: 4.5, rx: 1 },
  ],
  vault: [
    { shape: "rect", x: 3.25, y: 4.75, width: 17.5, height: 14.5, rx: 2.5 },
    { shape: "circle", cx: 11, cy: 12, r: 3.5 },
    { shape: "path", d: "M17.5 9.5v5" },
  ],
  link: [
    { shape: "rect", x: 2.75, y: 8.75, width: 11.5, height: 6.5, rx: 3.25 },
    { shape: "rect", x: 9.75, y: 8.75, width: 11.5, height: 6.5, rx: 3.25 },
  ],
} as const satisfies Record<string, readonly MarkShape[]>;

export type MarkId = keyof typeof marks;

export const markIds = Object.keys(marks) as readonly MarkId[];

export function markShapes(id: string): readonly MarkShape[] {
  return (marks as Record<string, readonly MarkShape[]>)[id] ?? [];
}
