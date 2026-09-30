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
 *
 * A preview deployment is behind Vercel Authentication, and that needs saying
 * because the failure is otherwise very confusing: an anonymous request gets the
 * login interstitial, which is a **200** carrying none of the site's content. So
 * every assertion below fails at once, for reasons that have nothing to do with
 * the build, and it looks like the deployment is catastrophically broken.
 *
 *   node scripts/smoke.mjs https://<deployment>.vercel.app --via-vercel-cli
 *
 * routes every request through `vercel curl`, which carries the protection
 * bypass. Pass `SITE_URL` to say what the deployment should claim as its origin —
 * for a preview, the preview's own URL.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] ?? 'http://127.0.0.1:4175').replace(/\/+$/, '');
const viaVercelCli = process.argv.includes('--via-vercel-cli');

const failures = [];

/**
 * The minimum of `Response` that this script uses: `ok`, `status`, `headers.get`
 * and `text()`. Two implementations, one interface, so every assertion below is
 * written once and runs against a local server or a protected preview.
 */
function cliRequest(path, init = {}) {
  // `vercel curl` carries a protection bypass for the deployment under test; it
  // is not a general-purpose HTTP client, so an external origin is not fetched
  // through it. That check reports a miss rather than pretending to have tried.
  if (typeof path === 'object' && path?.absolute) {
    failures.push(
      `${path.absolute}: not checked — the Vercel CLI transport only fetches the deployment itself`,
    );
    return { ok: false, status: 0, headers: { get: () => null }, text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) };
  }
  const target = `${base}${path}`;

  let raw;
  try {
    raw = execFileSync(
      'vercel',
      ['curl', '-s', '-i', init.method === 'HEAD' ? '-I' : null, target].filter(Boolean),
      // Bytes, not a string: `/og.png` is checked by its magic number, and a
      // UTF-8 round trip through `encoding: 'utf8'` would corrupt them.
      { encoding: 'buffer', maxBuffer: 128 * 1024 * 1024, cwd: root, stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch (error) {
    // The CLI failing is not the site failing, and the two must not be reported
    // as one thing — otherwise a logged-out shell reads as a broken deployment.
    const reason = String(error.stderr ?? error.message).split('\n')[0].trim();
    failures.push(`${path}: could not reach it through the Vercel CLI — ${reason || 'the command failed'}`);
    return {
      ok: false,
      status: 0,
      headers: { get: () => null },
      text: async () => '',
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  }

  // `curl -i` prints the status line, then the headers, then a blank line, then
  // the body. Split at the *first* blank line: a body may contain one, but a
  // header block never follows one.
  // The needle must be a string: `Buffer.indexOf` with a number matches a single
  // byte, so a multi-byte needle silently never matches and everything after it
  // comes back as an unparsed header block.
  const at = raw.indexOf('\r\n\r\n') !== -1 ? raw.indexOf('\r\n\r\n') : raw.indexOf('\n\n');
  const delimiter = raw.at(at) === 0x0d ? 4 : 2;
  const head = raw.subarray(0, at).toString('latin1');
  const body = raw.subarray(at + delimiter);

  const status = Number(/^HTTP\/[^\s]+ (\d{3})/im.exec(head)?.[1] ?? 0);
  const headers = new Map();
  for (const line of head.split(/\r?\n/).slice(1)) {
    const colon = line.indexOf(':');
    if (colon > 0) headers.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers.get(String(name).toLowerCase()) ?? null },
    text: async () => body.toString('utf8'),
    arrayBuffer: async () => {
      const copy = new Uint8Array(body.length);
      copy.set(body);
      return copy.buffer;
    },
  };
}

/**
 * One seam, so no assertion has to know which transport it is on.
 *
 * `path` may be absolute — the og:image check fetches an external URL — in which
 * case the base is not applied.
 */
const request = async (path, init) => {
  // Async so both transports hand back a promise: callers chain `.catch()` on the
  // result, which only exists for `fetch`.
  const absolute = /^https?:\/\//i.test(path);
  if (!absolute) {
    return viaVercelCli ? cliRequest(path, init) : fetch(`${base}${path}`, { redirect: 'follow', ...init });
  }

  // An absolute URL back to this same deployment — which is what `og:image` is,
  // once it has been resolved against the canonical — goes down the same path as
  // every other request, so it is actually fetched rather than skipped.
  let sameOrigin = false;
  try {
    sameOrigin = new URL(path).origin === new URL(base).origin;
  } catch {
    /* not parseable; treat as external */
  }
  if (sameOrigin) {
    const { pathname, search } = new URL(path);
    return viaVercelCli
      ? cliRequest(`${pathname}${search}`, init)
      : fetch(`${base}${pathname}${search}`, { redirect: 'follow', ...init });
  }

  return fetch(path, { redirect: 'follow', ...init });
};

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

// Whichever origin this deployment is served from. A preview names itself in
// every identifier, and none of those are foreign — a URL pointing at the host
// that served the document is by definition the same site. Without this, running
// against a preview reports every JSON-LD `@id` as a stray origin, which buries
// the one stray that would actually be a mistake.
for (const origin of [configuredDomain, expectedOrigin, base]) {
  try { allowedOrigins.add(new URL(origin).origin); } catch { /* not a URL */ }
}

/**
 * Every route the deployment should serve, read from the product registry.
 *
 * Read rather than listed, so a product added to `areas.ts` is checked the moment
 * it is added. A route that is prerendered but never deployed is a link that
 * 404s, and nothing upstream of this script would have noticed.
 */
const productBlock = areasSource.slice(areasSource.indexOf('export const products'));
const productSlugs = [...productBlock.matchAll(/^    id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);
const routes = ['/', '/products', ...productSlugs.map((slug) => `/products/${slug}`)];
for (const source of [siteSource, areasSource]) {
  for (const match of source.matchAll(/href: '(https:[^']+)'/g)) {
    try { allowedOrigins.add(new URL(match[1]).origin); } catch { /* not a URL */ }
  }
}

console.log(`smoke: ${base}${viaVercelCli ? ' (through the Vercel CLI, with protection bypass)' : ''}\n`);

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
    response = await request(endpoint.path);
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
  const response = await request('/');
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
      `canonical is ${canonical}, expected ${expectedOrigin}. ` +
        (process.env.SITE_URL
          ? `The build was checked against a SITE_URL override but the document names a different origin — ` +
            `was it built without SITE_URL set, or is the deployment serving a different build?`
          : `The build names an origin other than site.domain — was SITE_URL left set on a previous build?`),
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
    const imageResponse = await request(resolved, { method: 'HEAD' }).catch(() => null);
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

// --- 3b. Every route is actually deployed ---------------------------------
// A prerendered route that the deployment does not serve is a link that 404s,
// and nothing upstream of this script would have noticed.
const routeProblems = [];
for (const route of routes) {
  let response;
  try {
    response = await request(route);
  } catch (error) {
    routeProblems.push(`${route}: request failed — ${error.message}`);
    continue;
  }
  if (response.status !== 200) {
    routeProblems.push(`${route}: HTTP ${response.status}`);
    continue;
  }

  const document = await response.text();
  const documentFlat = document.replace(/\s+/g, ' ');

  // A deployment behind Vercel Authentication answers an anonymous request with
  // the login interstitial: a **200**, no prerendered markup, no canonical. Every
  // assertion below then fails at once and it reads like a catastrophically broken
  // deploy, when the only thing wrong is that the request was not authenticated.
  // Say so once, clearly, instead of forty times confusingly.
  if (/Protected by Vercel Authentication|vercel\.com\/login|Continue with GitHub/i.test(documentFlat)) {
    routeProblems.push(
      `${route}: this deployment is behind Vercel Authentication — re-run with --via-vercel-cli ` +
        'so the requests carry the protection bypass',
    );
    continue;
  }

  // Its own canonical, not the homepage's. A product page serving the homepage
  // canonical tells a search engine the two are the same document.
  const canonical = documentFlat.match(/rel="canonical" href="([^"]+)"/)?.[1];
  const wanted = `${expectedOrigin}${route === '/' ? '/' : route}`;
  if (canonical !== wanted) routeProblems.push(`${route}: canonical is ${canonical}, expected ${wanted}`);

  if (!/<div id="root"><div/.test(document)) routeProblems.push(`${route}: no prerendered markup`);

  const pageText = (document.split('<div id="root">')[1] ?? '')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (pageText.length < 500) {
    routeProblems.push(`${route}: only ${pageText.length} characters of prerendered text`);
  }

  if (route.startsWith('/products/')) {
    const slug = route.split('/').pop();
    // Its own product node, and only its own. Describing all eleven on every
    // page makes each page's structured data assert things about products it is
    // not about.
    const described = [...document.matchAll(/#product-([a-z0-9-]+)/g)].map((m) => m[1]);
    if (!described.includes(slug)) routeProblems.push(`${route}: its JSON-LD does not describe ${slug}`);
    if (described.length > 1) {
      routeProblems.push(`${route}: JSON-LD describes ${described.length} products, expected only its own`);
    }
  }
}

for (const problem of routeProblems) failures.push(problem);
notes.push(`routes       ${routes.length} checked, ${routeProblems.length ? 'with problems' : 'all serve their own canonical'}`);

// --- 4. Security headers ---------------------------------------------------
const headerResponse = await request('/');
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
    const response = await request(path, { method: 'HEAD' }).catch(() => null);
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
