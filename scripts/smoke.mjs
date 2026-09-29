#!/usr/bin/env node
/**
 * Smoke tests against a deployed URL.
 *
 * Everything else in this repository checks the build. That is not the same
 * thing: a build can be correct and a deployment still be wrong. A preview
 * environment with the production header missing, a rewrite that strips the
 * query string, a CDN that serves a stale index.html — none of those fail a
 * local check, and all of them are invisible until someone visits.
 *
 * So this runs against whatever URL it is given. Locally that is the
 * header-served dist/; in CI after a deploy it is the deployment.
 *
 *   node scripts/smoke.mjs                              # http://127.0.0.1:4175
 *   node scripts/smoke.mjs https://hilbras.vercel.app    # production
 *
 * Exits non-zero on the first failure set, and prints every problem it found
 * rather than stopping at the first, because a broken deployment usually breaks
 * several things at once.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] ?? 'http://127.0.0.1:4175').replace(/\/+$/, '');

const failures = [];
const notes = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

/** The origin the site claims to live at, read from the data layer. */
const siteSource = await readFile(join(root, 'src/data/site.ts'), 'utf8');
const areasSource = await readFile(join(root, 'src/data/areas.ts'), 'utf8');
const configuredDomain = siteSource.match(/domain: '([^']+)'/)?.[1];

// The canonical is expected to name the configured domain, not whatever host
// happens to be serving the bytes. Running the smoke test against a local
// server must not make the production canonical look wrong. Set SITE_URL to
// assert a different origin — that is what a preview deployment does.
const expectedOrigin = (process.env.SITE_URL ?? configuredDomain).replace(/\/+$/, '');

// Origins the document is allowed to reference: the site itself, the
// organisation on GitHub, and any product's own deployed site.
const allowedOrigins = new Set([configuredDomain, 'https://github.com', 'https://schema.org']);
for (const source of [siteSource, areasSource]) {
  for (const match of source.matchAll(/href: '(https:[^']+)'/g)) {
    try { allowedOrigins.add(new URL(match[1]).origin); } catch { /* not a URL */ }
  }
}

console.log(`smoke: ${base}\n`);

// --- 1. Endpoints -----------------------------------------------------------
// Every path a crawler or a browser is told to fetch.
const endpoints = [
  { path: '/', type: 'text/html', mustContain: ['<!doctype html', '<title>'] },
  { path: '/robots.txt', type: 'text/plain', mustContain: ['User-agent', 'Sitemap:'] },
  { path: '/sitemap.xml', type: 'application/xml', mustContain: ['<urlset', '<loc>'] },
  { path: '/site.webmanifest', type: 'application/manifest+json', mustContain: ['"name"', '"icons"'] },
  { path: '/theme-init.js', type: ['text/javascript', 'application/javascript'], mustContain: ['hilbras-theme'] },
  { path: '/favicon.svg', type: 'image/svg+xml', mustContain: ['<svg'] },
  { path: '/og.png', type: 'image/png', mustContain: [] },
];

for (const endpoint of endpoints) {
  let response;
  try {
    response = await fetch(`${base}${endpoint.path}`, { redirect: 'follow' });
  } catch (error) {
    failures.push(`${endpoint.path}: request failed — ${error.message}`);
    continue;
  }

  const label = `${endpoint.path}`.padEnd(20);
  if (response.status !== 200) {
    failures.push(`${endpoint.path}: HTTP ${response.status}`);
    continue;
  }
  notes.push(`${label} 200`);

  const contentType = response.headers.get('content-type') ?? '';
  // A list of acceptable types, not one. Vercel serves `.js` as
  // `application/javascript` and the local server as `text/javascript`; both are
  // valid JavaScript MIME types and the CSP treats them identically — the live
  // site reports zero violations while serving the first. Asserting a single
  // spelling would fail the deployment for something it is not doing wrong.
  const expectedTypes = [endpoint.type].flat().filter(Boolean);
  if (expectedTypes.length && !expectedTypes.some((type) => contentType.includes(type))) {
    failures.push(`${endpoint.path}: content-type is "${contentType}", expected one of ${expectedTypes.join(', ')}`);
  }

  // Binary assets are checked by their magic bytes rather than decoded.
  if (endpoint.type === 'image/png') {
    const bytes = new Uint8Array(await response.arrayBuffer());
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    if (!isPng) failures.push('/og.png: not a PNG');
    if (bytes.length < 1000) failures.push(`/og.png: implausibly small at ${bytes.length} bytes`);
  } else {
    const text = await response.text();
    for (const fragment of endpoint.mustContain) {
      if (!text.includes(fragment)) {
        failures.push(`${endpoint.path}: does not contain ${JSON.stringify(fragment)}`);
      }
    }
  }
}

// --- 2. The document --------------------------------------------------------
let html = '';
try {
  const response = await fetch(`${base}/`, { redirect: 'follow' });
  html = await response.text();
} catch (error) {
  failures.push(`/: could not be fetched — ${error.message}`);
}

if (html) {
  const flat = html.replace(/\s+/g, ' ');
  const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, ' ');

  // Metadata a crawler reads before rendering anything.
  const title = flat.match(/<title>([^<]*)<\/title>/)?.[1];
  check(Boolean(title?.trim()), 'no <title>');
  check((title?.length ?? 0) < 70, `<title> is ${title?.length} chars; over 70 gets truncated in results`);

  const descriptions = [
    ['meta description', flat.match(/<meta name="description"[^>]*content="([^"]*)"/)?.[1]],
    ['og:description', flat.match(/<meta property="og:description"[^>]*content="([^"]*)"/)?.[1]],
    ['twitter:description', flat.match(/<meta name="twitter:description"[^>]*content="([^"]*)"/)?.[1]],
  ];
  for (const [label, value] of descriptions) check(Boolean(value), `no ${label}`);
  const distinct = new Set(descriptions.map(([, v]) => v));
  check(distinct.size === 1, `the published descriptions disagree: ${[...distinct].join(' vs ')}`);

  const canonical = flat.match(/rel="canonical" href="([^"]+)"/)?.[1];
  check(Boolean(canonical), 'no canonical URL');
  if (canonical) {
    check(
      canonical.replace(/\/+$/, '') === expectedOrigin,
      `canonical is ${canonical}, expected ${expectedOrigin}`,
    );
  }

  for (const [pattern, label] of [
    [/property="og:title"/, 'og:title'],
    [/property="og:description"/, 'og:description'],
    [/property="og:image"/, 'og:image'],
    [/property="og:image:width"/, 'og:image:width'],
    [/name="twitter:card"/, 'twitter:card'],
    [/rel="manifest"/, 'web manifest link'],
    [/<meta name="viewport"/, 'viewport'],
  ]) {
    check(pattern.test(flat), `no ${label}`);
  }

  // The og:image must be a real image URL, not the site root. This was a real
  // bug: a preview card pointing at the homepage renders blank.
  const ogImage = flat.match(/property="og:image" content="([^"]+)"/)?.[1];
  if (ogImage) {
    const resolved = new URL(ogImage, base);
    const imageResponse = await fetch(resolved, { method: 'HEAD' }).catch(() => null);
    check(imageResponse?.ok ?? false, `og:image ${ogImage} is not fetchable (${imageResponse?.status ?? 'no response'})`);
    check(!/\/$/.test(new URL(ogImage).pathname), `og:image points at a directory: ${ogImage}`);
  }

  // Prerendered content, which is the whole reason the prerender step exists.
  check(/<div id="root"><div/.test(html), 'the prerender injected nothing into #root');
  const body = html.split('<div id="root">')[1] ?? '';
  const text = body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  check(text.length > 4000, `only ${text.length} characters of prerendered text`);
  check(text.includes('Build. Connect.'), 'the headline is missing from the static HTML');

  const ids = new Set([...withoutNoscript.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const dead = [...new Set(
    [...withoutNoscript.matchAll(/href="#([^"]*)"/g)].map((m) => m[1]).filter((id) => id && !ids.has(id)),
  )];
  check(dead.length === 0, `anchors with no matching id: ${dead.join(', ')}`);

  const h1s = (withoutNoscript.match(/<h1[\s>]/g) ?? []).length;
  check(h1s === 1, `expected exactly one h1, found ${h1s}`);

  check(!/<script>/.test(flat), 'an inline <script> is present, which the CSP would block');

  // --- 3. Structured data ---------------------------------------------------
  const blocks = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ?? [];
  check(blocks.length === 1, `expected one JSON-LD block, found ${blocks.length}`);
  if (blocks.length === 1) {
    try {
      const parsed = JSON.parse(blocks[0].replace(/<\/?script[^>]*>/g, ''));
      check(parsed['@context'] === 'https://schema.org', 'JSON-LD has the wrong @context');
      const graph = parsed['@graph'] ?? [];
      check(graph.length >= 13, `JSON-LD graph has ${graph.length} nodes`);
      const types = graph.map((n) => n['@type']);
      for (const type of ['Organization', 'WebSite', 'OperatingSystem', 'SoftwareSourceCode']) {
        check(types.includes(type), `JSON-LD has no ${type} node`);
      }
      // Every identifier must use the configured domain, or a migration left one
      // pointing at the old host.
      const strays = graph
        .flatMap((node) => [node['@id'], node.url, node.url, node.codeRepository, node.publisher?.['@id']])
        .filter((value) => typeof value === 'string')
        .filter((value) => value.startsWith('http'))
        .filter((value) => {
          try { return !allowedOrigins.has(new URL(value).origin); } catch { return true; }
        });
      check(strays.length === 0, `JSON-LD references a foreign origin: ${[...new Set(strays)].join(', ')}`);
    } catch (error) {
      failures.push(`JSON-LD does not parse: ${error.message}`);
    }
  }
}

// --- 4. Security headers ---------------------------------------------------
const headerResponse = await fetch(`${base}/`, { redirect: 'follow' });
const header = (name) => headerResponse.headers.get(name) ?? '';
const lower = (name) => name.toLowerCase();

if (base.startsWith('https://')) {
  const csp = header('content-security-policy');
  check(Boolean(csp), 'no Content-Security-Policy');
  if (csp) {
    const directives = Object.fromEntries(
      csp.split(';').map((part) => {
        const [name, ...values] = part.trim().split(/\s+/);
        return [name, values];
      }),
    );
    check(!directives['script-src']?.includes("'unsafe-inline'"), "script-src allows 'unsafe-inline'");
    check(!directives['script-src']?.includes("'unsafe-eval'"), "script-src allows 'unsafe-eval'");
    check(!directives['style-src']?.includes("'unsafe-inline'"), "style-src allows 'unsafe-inline'");
    check(directives['object-src']?.includes("'none'"), "object-src is not 'none'");
    check(directives['base-uri']?.includes("'self'"), "base-uri is not 'self'");
    check(Boolean(directives['frame-ancestors']), 'no frame-ancestors directive');
    check(Boolean(directives['default-src']), 'no default-src directive');
  }
  check(header('strict-transport-security').includes('max-age='), 'no Strict-Transport-Security');
  check(header(lower('x-content-type-options')) === 'nosniff', 'X-Content-Type-Options is not nosniff');
  check(Boolean(header('referrer-policy')), 'no Referrer-Policy');
  check(Boolean(header('permissions-policy')), 'no Permissions-Policy');
  check(/sameorigin|deny/i.test(header(lower('x-frame-options'))), 'no X-Frame-Options');
  check(Boolean(header('cross-origin-opener-policy')), 'no Cross-Origin-Opener-Policy');
} else {
  notes.push('security headers  skipped (http:// — not meaningful off HTTPS)');
}

// --- 5. Every asset the document references ---------------------------------
if (html) {
  const referenced = new Set(
    [...html.matchAll(/(?:src|href)="(\/[^"#?]*\.(?:js|css|woff2|png|svg|webmanifest|xml|txt))"/g)].map((m) => m[1]),
  );
  const broken = [];
  for (const path of referenced) {
    const response = await fetch(`${base}${path}`, { method: 'HEAD' }).catch(() => null);
    if (!response?.ok) broken.push(`${path} (${response?.status ?? 'no response'})`);
  }
  check(broken.length === 0, `assets referenced by the document do not load: ${broken.join(', ')}`);
  notes.push(`assets        ${referenced.size} referenced, all load`);
}

// --- 6. Product content is actually present --------------------------------
if (html) {
  const missing = ['Hilbras SDK', 'Hilbras Remembera', 'Hilbras Keystone', 'HilPress', 'Hilbras Studio',
    'Hilbras Gateway', 'OmniHilbras', 'Hilbras OS', 'Hilbras Code', 'HilGit', 'Hilbras Spectra']
    .filter((name) => !html.includes(name));
  check(missing.length === 0, `products missing from the served document: ${missing.join(', ')}`);
}

// --- Report -----------------------------------------------------------------
for (const note of notes) console.log(`  ok  ${note}`);
if (failures.length) {
  console.error(`\nsmoke: ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  -  ${failure}`);
  console.error('');
  process.exit(1);
}
console.log(`\nsmoke: passed — ${base}\n`);
