#!/usr/bin/env node
/**
 * Generates the application icons from `public/favicon.svg`.
 *
 * The manifest previously used the 1200x630 social card as its icon, which is
 * the wrong shape for every consumer of a manifest icon: Android home screens
 * mask it, Windows tiles crop it, and a 630px-tall image asked to render at
 * 192px square is resampled from the wrong aspect ratio. A manifest is a promise
 * about the site's shape, and it was making one it could not keep.
 *
 * Two kinds of icon are produced, because they are used differently:
 *
 * - `any` icons carry the mark on the brand background, cropped as the design
 *   intends, with the rounded square baked in.
 * - The maskable icon is for Android's adaptive-icon masking, which crops to
 *   whatever shape the launcher uses — a circle, a squircle, a teardrop. Only
 *   the inner 80% of the canvas is guaranteed visible, so the mark is scaled
 *   into that safe zone and the background bleeds to all four edges. Without the
 *   bleed the launcher clips a transparent corner and the icon shows through as
 *   a hole.
 *
 * Rendering goes through Chromium, which is already a build dependency for the
 * end-to-end tests, so the icons come from the real SVG rather than a
 * reimplementation of it.
 *
 *   node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'public', 'icons');

/** The brand background, matching `--bg` in the dark theme. */
const BACKGROUND = '#0c0b09';

const icons = [
  // Standard square icons. The SVG's own 64-unit viewBox already includes the
  // rounded background rect, so it is rendered as-is.
  { file: 'icon-192.png', size: 192, mark: 1, background: false, purpose: 'any' },
  { file: 'icon-512.png', size: 512, mark: 1, background: false, purpose: 'any' },

  // Maskable: full-bleed background, mark inside the 80% safe zone. The mark is
  // drawn at 60% rather than 80% because the safe zone already reserves the
  // outer 10% on each side, and a mark that touches it is still at risk on the
  // more aggressive launcher masks.
  { file: 'icon-maskable-512.png', size: 512, mark: 0.6, background: true, purpose: 'maskable' },
];

const svg = await (await import('node:fs/promises')).readFile(join(root, 'public', 'favicon.svg'), 'utf8');
await mkdir(iconsDir, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();

for (const icon of icons) {
  const document = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; background: transparent; }
  /* The mark is centred and scaled. For the maskable variant the background is
     a full-bleed rect behind it rather than the SVG's own rounded square. */
  .frame { width: ${icon.size}px; height: ${icon.size}px; display: grid; place-items: center;
           background: ${icon.background ? BACKGROUND : 'transparent'}; }
  .mark { width: ${Math.round(icon.size * icon.mark)}px; height: ${Math.round(icon.size * icon.mark)}px; }
  .mark svg { width: 100%; height: 100%; display: block; }
  ${icon.background ? '.mark svg rect:first-of-type { display: none; }' : ''}
</style></head>
<body><div class="frame"><div class="mark">${svg.replace(/role="img" aria-label="[^"]*"/, 'aria-hidden="true"')}</div></div></body></html>`;

  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(document, { waitUntil: 'load' });
  const buffer = await page.locator('.frame').screenshot({ omitBackground: !icon.background });
  await writeFile(join(iconsDir, icon.file), buffer);
  console.log(`icons: ${icon.file}  ${icon.size}x${icon.size}  ${(buffer.length / 1024).toFixed(1)} kB  ${icon.purpose}`);
}

await browser.close();
console.log('icons: written to public/icons/');
