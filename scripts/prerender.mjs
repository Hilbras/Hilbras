#!/usr/bin/env node
/**
 * Turns `dist/index.html` into a fully crawlable document.
 *
 * Why this exists: search engines run JavaScript, but a growing number of
 * crawlers — GPTBot, ClaudeBot, PerplexityBot, most archiving tools — do not.
 * Before this step the built HTML held the metadata and a short `<noscript>`
 * summary but no page content. After it, the whole document ships as static HTML
 * and React hydrates on top of it.
 *
 * It also rewrites every absolute URL from `site.domain` and injects the
 * JSON-LD graph, so the canonical, Open Graph, Twitter and structured data can
 * never drift from the value in `src/data/site.ts`.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distIndex = join(root, 'dist', 'index.html');
const ssrEntry = join(root, '.ssr', 'entry-server.mjs');

const { render, site, buildStructuredDataDocument } = await import(ssrEntry);
const origin = site.domain.replace(/\/+$/, '');
const markup = render();
let html = await readFile(distIndex, 'utf8');

// 1. The rendered app replaces the empty mount point.
if (!html.includes('<div id="root"></div>')) {
  throw new Error('prerender: expected an empty <div id="root"></div> in dist/index.html');
}
html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

/**
 * Rewrite an absolute URL in the document. Whitespace inside the tag is
 * tolerated because Vite reformats the built HTML onto multiple lines.
 * `path` is appended to the origin, so pass `''` for the site root.
 */
const setUrl = (pattern, path) => {
  html = html.replace(pattern, (_match, before, after) => `${before}${origin}${path}${after}`);
};

setUrl(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/gi, '/');
setUrl(/(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/gi, '/');
// The image is a file, not a route — pointing these at the site root would
// produce a preview card with no image on it.
setUrl(/(<meta[^>]*property="og:image"[^>]*content=")[^"]*(")/gi, '/og.png');
setUrl(/(<meta[^>]*name="twitter:image"[^>]*content=")[^"]*(")/gi, '/og.png');

// 2. One JSON-LD graph, in the head. It is not part of the React tree: rendering
//    it as a component would put a second copy inside <body>.
if (!html.includes('application/ld+json')) {
  // Already a JSON string; serialising it again would double-encode it.
  const graph = buildStructuredDataDocument();
  html = html.replace('</head>', `    <script type="application/ld+json">${graph}</script>\n  </head>`);
}

await writeFile(distIndex, html, 'utf8');

// The compiled SSR bundle has done its job: validation, the SEO files, and this
// step have all read from it.
await rm(join(root, '.ssr'), { recursive: true, force: true });

console.log(
  `prerender: injected ${(markup.length / 1024).toFixed(1)} kB of markup, ` +
    `${(html.length / 1024).toFixed(1)} kB document, origin ${origin}`,
);
