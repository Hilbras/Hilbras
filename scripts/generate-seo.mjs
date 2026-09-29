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

const { site } = await import(ssrEntry);
const origin = site.domain.replace(/\/+$/, '');

const robots = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

/**
 * One URL today. When product pages exist they belong here, generated from the
 * product data rather than hand-maintained.
 */
const routes = [{ path: '/', priority: '1.0', changefreq: 'weekly' }];

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
    display: 'standalone',
    background_color: '#0c0b09',
    theme_color: '#0c0b09',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/og.png', sizes: '1200x630', type: 'image/png' },
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
