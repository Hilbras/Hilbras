#!/usr/bin/env node
/**
 * Serves `dist/` with the exact headers from vercel.json.
 *
 * A Content Security Policy that is only ever checked by a deployment is a
 * Content Security Policy that is broken on the day it ships. This applies the
 * real policy locally so the test suite runs against it.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

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

/** Picks the most specific matching header rule, the way Vercel does. */
function headersFor(pathname) {
  const out = {};
  for (const rule of vercel.headers) {
    if (rule.source === '/(.*)' || pathname.startsWith(rule.source.replace('/(.*)', ''))) {
      for (const h of rule.headers) out[h.key] = h.value;
    }
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
  try {
    const info = await stat(path);
    if (info.isDirectory()) path = join(path, 'index.html');
  } catch {
    path = join(dist, 'index.html');
  }

  try {
    const body = await readFile(path);
    res.writeHead(200, {
      'Content-Type': types[extname(path)] ?? 'application/octet-stream',
      ...headersFor(url.pathname),
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
}).listen(4175, '127.0.0.1', () => {
  console.log('csp-test: serving dist/ on http://127.0.0.1:4175 with the vercel.json headers');
});
