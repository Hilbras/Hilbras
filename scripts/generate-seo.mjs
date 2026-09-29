#!/usr/bin/env node
/**
 * Writes the files that must agree with the canonical domain.
 *
 * `robots.txt`, `sitemap.xml`, and `site.webmanifest` were static files with
 * `https://hilbras.vercel.app` written into them, which meant moving to a real
 * domain meant finding every copy by hand — and one was missed. They are
 * generated from `site.domain` instead, and the static copies are deleted.
 *
 * Runs before the prerender step so a failure here fails the build.
 */
import { writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ssrEntry = join(root, '.ssr', 'entry-server.mjs');

const { site, counts, resolveSiteUrl, allRoutes } = await import(ssrEntry);
const origin = resolveSiteUrl();

const robots = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

/**
 * Every route, generated from the route table rather than listed by hand.
 *
 * A hand-maintained list is how a page ends up missing from the sitemap, which
 * is invisible until a search engine does not find it. This reads the same
 * `allRoutes()` the prerender uses, so a product added to `areas.ts` is in the
 * sitemap, has a page, and has JSON-LD, with no second edit anywhere.
 */
const routes = allRoutes().map((route) => {
  const isProduct = route.kind === 'product';
  return {
    path: route.kind === 'home' ? '/' : route.path,
    // The homepage is the company's front door; the index and the product
    // pages are the catalogue underneath it.
    priority: route.kind === 'home' ? '1.0' : isProduct ? '0.8' : '0.9',
    changefreq: isProduct ? 'monthly' : 'weekly',
  };
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${origin}${route.path}</loc>
    <lastmod>${site.lastModified}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const manifest = `${JSON.stringify(
  {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    // The dark brand surface, so a launch on a light home screen does not flash
    // white before the app paints.
    background_color: '#0c0b09',
    theme_color: '#0c0b09',
    lang: 'en',
    dir: 'ltr',
    categories: ['developer', 'productivity', 'utilities'],
    // Real application icons in the shapes consumers expect. This previously
    // listed the 1200x630 social card, which every icon consumer resamples from
    // the wrong aspect ratio and Android's adaptive-icon mask crops to nothing.
    // Generated from public/favicon.svg by scripts/generate-icons.mjs.
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      // The vector mark, for consumers that prefer it and for high-density
      // contexts. Kept last: it has no intrinsic size, so a consumer that
      // cannot measure it should fall through to the PNGs above.
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  },
  null,
  2,
)}\n`;

// Remove the hand-maintained copies so there is only ever one of each.
for (const file of ['robots.txt', 'sitemap.xml']) {
  await rm(join(root, 'public', file), { force: true });
}

await writeFile(join(root, 'dist', 'robots.txt'), robots, 'utf8');
await writeFile(join(root, 'dist', 'sitemap.xml'), sitemap, 'utf8');
await writeFile(join(root, 'dist', 'site.webmanifest'), manifest, 'utf8');

console.log(`seo: robots.txt, sitemap.xml, site.webmanifest written for ${origin}`);
