#!/usr/bin/env node
/**
 * Serves `dist/` with the exact headers from vercel.json.
 *
 * A Content Security Policy that is only ever checked by a deployment is a
 * Content Security Policy that is broken on the day it ships. This applies the
 * real policy locally so the test suite runs against it.
 *
 * **Two things are deliberately withheld, both for the same reason: this server
 * is plain HTTP on loopback and has no TLS to offer.**
 *
 * `Strict-Transport-Security` tells a client every future request to this origin
 * must be HTTPS, and the CSP carries `upgrade-insecure-requests`, which upgrades
 * every `http://` subresource to `https://`. Both are correct in production and
 * both are actively harmful here: WebKit honours them for `127.0.0.1`, every
 * asset then fails on a TLS handshake error, the page loads inert, and 27 tests
 * fail for reasons that have nothing to do with the site.
 *
 * Chromium and Firefox exempt loopback from both, which is exactly why only one
 * engine saw it and why the suite was green in two browsers and broken in the
 * third. The lesson generalises: a policy that is only ever tested on the one
 * platform that exempts you is not tested.
 *
 * `assert-security-headers.mjs` checks both where they take effect — in
 * `vercel.json`, which is what the deployment applies — so withholding them
 * here costs nothing in coverage.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

// Overridable so the end-to-end suite can pick its own port.
const port = Number(process.env.PORT ?? 4175);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

/**
 * Header rules that are not sent over plain HTTP on loopback.
 *
 * Only HSTS, and only because this server has no TLS to offer. See the note at
 * the top of this file: WebKit upgrades loopback to HTTPS when it sees the
 * header, and then every asset fails on a TLS handshake error.
 */
const WITHHELD_OVER_HTTP = new Set(['strict-transport-security']);

/**
 * CSP directives stripped for the same reason.
 *
 * `upgrade-insecure-requests` upgrades every `http://` subresource to `https://`,
 * which is correct in production and fatal here — there is no TLS on this port.
 * WebKit honours it for loopback, so every asset fails and the page loads inert.
 */
const STRIPPED_CSP_DIRECTIVES = ['upgrade-insecure-requests'];

/** Picks the most specific matching header rule, the way Vercel does. */
function headersFor(pathname) {
  const out = {};
  for (const rule of vercel.headers) {
    if (rule.source === '/(.*)' || pathname.startsWith(rule.source.replace('/(.*)', ''))) {
      for (const h of rule.headers) out[h.key] = h.value;
    }
  }
  // Header names are case-insensitive, and `vercel.json` writes them in title
  // case — comparing lowercased keys is the only way this actually matches.
  for (const key of Object.keys(out)) {
    if (WITHHELD_OVER_HTTP.has(key.toLowerCase())) delete out[key];
  }

  // Same reasoning, applied to the policy rather than the transport: the
  // directive is correct and simply has nothing to upgrade to here.
  const csp = out['Content-Security-Policy'];
  if (typeof csp === 'string') {
    out['Content-Security-Policy'] = csp
      .split(';')
      .map((directive) => directive.trim())
      .filter((directive) => !STRIPPED_CSP_DIRECTIVES.includes(directive))
      .join('; ');
  }
  return out;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = normalize(join(dist, decodeURIComponent(url.pathname)));
  if (!path.startsWith(dist)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  // A real static host serves a directory's index.html, and a path that matches
  // nothing as 404 with `404.html` and a 404 status. Falling back to the
  // homepage for everything else is what a dev server does, and it made the
  // unknown-path test assert nothing.
  let status = 200;
  try {
    const info = await stat(path);
    if (info.isDirectory()) path = join(path, 'index.html');
    await stat(path);
  } catch {
    path = join(dist, '404.html');
    status = 404;
  }

  try {
    const body = await readFile(path);
    res.writeHead(status, {
      'Content-Type': types[extname(path)] ?? 'application/octet-stream',
      ...headersFor(url.pathname),
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`headers: serving dist/ on http://127.0.0.1:${port} with the vercel.json headers`);
});
