#!/usr/bin/env node
/**
 * Turns `dist/` into a crawlable document per route.
 *
 * Why this exists: search engines run JavaScript, but a growing number of
 * crawlers — GPTBot, ClaudeBot, PerplexityBot, most archiving tools — do not.
 * Before this step the built HTML held the metadata and a short `<noscript>`
 * summary but no page content. After it, every route ships as static HTML and
 * React hydrates on top of it.
 *
 * Why per route: the route table comes from the product registry, so adding a
 * product produces a page, a sitemap entry and its own JSON-LD with no second
 * edit. Each document is written to `dist/<route>/index.html`, which is what a
 * static host serves for `/<route>` with or without `cleanUrls`.
 *
 * It also rewrites every absolute URL and every text field in `<head>` from
 * `src/data/site.ts`, so the canonical, Open Graph, Twitter and structured data
 * can never drift from the data layer or from each other.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrEntry = join(root, '.ssr', 'entry-server.mjs');

const {
  render,
  site,
  counts,
  areas,
  productById,
  buildRouteStructuredData,
  resolveSiteUrl,
  allRoutes,
} = await import(ssrEntry);

/**
 * How much of a title a search result will actually show.
 *
 * A search engine truncates at a pixel width — roughly 600px for a title, about
 * 60 characters of ordinary text — not at a character count, so this is an
 * approximation and is treated as one. It is a target, not a law.
 */
const TITLE_TARGET = 60;

const origin = resolveSiteUrl();
const shell = await readFile(join(dist, 'index.html'), 'utf8');
const routes = allRoutes();

/** Escapes a value for use inside a double-quoted HTML attribute. */
const attr = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * The document title for a route.
 *
 * The brand suffix is dropped when it would push the title past what a search
 * result shows. A search engine truncates a title at roughly 600 pixels — about
 * 60 characters — and the text beyond that is never read by anyone, so a title
 * of 77 characters is not a long title, it is a 17-character one with a tail
 * nobody sees. A product whose name already carries the brand gains nothing from
 * the suffix anyway, which is the common case.
 */
function titleFor(route) {
  const branded = (label) => {
    const full = `${label} — ${site.name}`;
    return full.length <= TITLE_TARGET ? full : label;
  };
  if (route.kind === 'product') return branded(productName(route));
  if (route.kind === 'productIndex') return branded('Products');
  if (route.kind === 'notFound') return branded('Not found');
  return `${site.name} — ${site.headline}`;
}

/** The meta description for a route, which must be unique per page. */
function descriptionFor(route) {
  if (route.kind === 'product') return productSummary(route);
  if (route.kind === 'productIndex') {
    // Written for the slot rather than assembled from two halves that each fit.
    // The previous version borrowed the tail of the homepage description and
    // came to 177 characters, of which a search result shows about 155 — the
    // rest was written, shipped, and never read by anyone.
    return (
      `All ${counts.products} Hilbras products, grouped by the area of technology they belong to: ` +
      `${areas.map((area) => area.short.toLowerCase()).join(', ')}.`
    );
  }
  if (route.kind === 'notFound') {
    return 'There is no page at this address. Browse every Hilbras product instead.';
  }
  return site.description;
}

// Product copy is read back out of the registry rather than threaded through,
// so a document's metadata cannot say something different from the page it
// describes.
const productFor = (route) => productById.get(route.id);
const productName = (route) => productFor(route)?.name ?? route.id;
const productSummary = (route) => {
  const product = productFor(route);
  if (!product) return site.description;
  return (
    `${product.summary} Part of the Hilbras ecosystem, which is building ` +
    `${counts.products} products across ${counts.areas} technology areas.`
  );
};

let totalMarkup = 0;

for (const route of routes) {
  // The shell is re-read per route because every substitution below replaces a
  // single value, and sharing one mutated string between documents is how one
  // page's title ends up on another.
  let html = shell;

  // 1. The rendered app replaces the empty mount point.
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('prerender: expected an empty <div id="root"></div> in dist/index.html');
  }
  const markup = render(route.path);
  totalMarkup += markup.length;
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

  /**
   * Rewrite an absolute URL in the document. Whitespace inside the tag is
   * tolerated because Vite reformats the built HTML onto multiple lines.
   * `path` is appended to the origin, so pass `''` for the site root.
   */
  const setUrl = (pattern, path) => {
    html = html.replace(pattern, (_match, before, after) => `${before}${origin}${path}${after}`);
  };

  /** Replaces the text content of the first attribute in a matched tag. */
  const setText = (pattern, value) => {
    html = html.replace(pattern, (_match, before) => `${before}${attr(value)}"`);
  };

  const title = titleFor(route);
  const description = descriptionFor(route);

  setText(/(<meta[^>]*name="description"[^>]*content=")[^"]*(")/gi, description);
  setText(/(<meta[^>]*property="og:description"[^>]*content=")[^"]*(")/gi, description);
  setText(/(<meta[^>]*name="twitter:description"[^>]*content=")[^"]*(")/gi, description);
  setText(/(<meta[^>]*property="og:site_name"[^>]*content=")[^"]*(")/gi, site.name);
  setText(/(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/gi, title);
  setText(/(<meta[^>]*name="twitter:title"[^>]*content=")[^"]*(")/gi, title);
  setText(/(<meta[^>]*property="og:image:alt"[^>]*content=")[^"]*(")/gi, site.imageAlt);
  setText(/(<meta[^>]*name="twitter:image:alt"[^>]*content=")[^"]*(")/gi, site.imageAlt);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${attr(title)}</title>`);

  // A product page is an article about that product, not another view of the
  // homepage. Saying otherwise is a small lie that structured data then repeats.
  if (route.kind === 'product') {
    setText(/(<meta[^>]*property="og:type"[^>]*content=")[^"]*(")/gi, 'article');
  }

  // The canonical is the route's own address. The homepage keeps a trailing
  // slash — it is what the shell shipped and what every other link to it
  // assumes, and changing it is a redirect, not a detail.
  const routePath = route.kind === 'home' ? '/' : route.path;
  setUrl(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/gi, routePath);
  setUrl(/(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/gi, routePath);

  // The image is a file, not a route — pointing these at the page path would
  // produce a preview card with no image on it.
  setUrl(/(<meta[^>]*property="og:image"[^>]*content=")[^"]*(")/gi, '/og.png');
  setUrl(/(<meta[^>]*name="twitter:image"[^>]*content=")[^"]*(")/gi, '/og.png');

  // 2. One JSON-LD graph per document, in the head. It is not part of the React
  //    tree: rendering it as a component would put a second copy inside <body>.
  if (!html.includes('application/ld+json')) {
    const graph = buildRouteStructuredData(route, origin);
    html = html.replace('</head>', `    <script type="application/ld+json">${graph}</script>\n  </head>`);
  }

  // `/` is index.html; everything else is `<route>/index.html`, which a static
  // host serves for `/<route>` whether or not `cleanUrls` is on.
  const target = route.kind === 'home' ? join(dist, 'index.html') : join(dist, route.path, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
}

// A real 404 document, served with a 404 status by the host. A prerendered page
// that renders "not found" but is served as 200 is worse than a plain error,
// because a crawler records it as content.
const notFoundRoute = { kind: 'notFound', path: '/404' };
let notFound = shell;
const notFoundMarkup = render(notFoundRoute.path);
notFound = notFound.replace('<div id="root"></div>', `<div id="root">${notFoundMarkup}</div>`);
notFound = notFound.replace(/<title>[\s\S]*?<\/title>/i, `<title>${attr(titleFor(notFoundRoute))}</title>`);
notFound = notFound.replace(
  /(<meta[^>]*name="robots"[^>]*content=")[^"]*(")/gi,
  '$1noindex, follow$2',
);
if (!notFound.includes('name="robots"')) {
  notFound = notFound.replace(
    '</head>',
    '    <meta name="robots" content="noindex, follow" />\n  </head>',
  );
}
await writeFile(join(dist, '404.html'), notFound, 'utf8');

// The compiled SSR bundle has done its job: validation, the SEO files, and this
// step have all read from it.
await rm(join(root, '.ssr'), { recursive: true, force: true });

// Which of the three sources supplied the origin, named in the build log
// because "the canonical is wrong and nothing says why" is a bad afternoon.
const source = (() => {
  if (process.env.SITE_URL?.trim()) return 'SITE_URL';
  if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development') {
    return `VERCEL_ENV=${process.env.VERCEL_ENV}`;
  }
  return 'site.domain';
})();

console.log(
  `prerender: ${routes.length} routes + a 404, ${(totalMarkup / 1024).toFixed(1)} kB of markup, ` +
    `origin ${origin} (from ${source})`,
);
