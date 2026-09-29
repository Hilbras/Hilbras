#!/usr/bin/env node
/**
 * Asserts the security headers are present and strong enough.
 *
 * A header that is quietly removed from vercel.json is invisible until someone
 * reports it, so it is checked like any other contract. The Content Security
 * Policy is checked for the properties that matter rather than for an exact
 * string, so tightening it does not break the build and loosening it does.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vercel = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

/** The catch-all rule, which is where the security headers live. */
const catchAll = vercel.headers?.find((rule) => rule.source === '/(.*)');
check(Boolean(catchAll), 'vercel.json has no catch-all header rule');
if (!catchAll) {
  console.error('security headers: no catch-all rule\n');
  process.exit(1);
}

const headers = Object.fromEntries(catchAll.headers.map((h) => [h.key.toLowerCase(), h.value]));

const required = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': /sameorigin|deny/i,
  'strict-transport-security': /max-age=\d{7,}/,
  'permissions-policy': /geolocation=\(\)/,
};

for (const [key, expected] of Object.entries(required)) {
  const value = headers[key];
  check(Boolean(value), `missing ${key}`);
  if (!value) continue;
  check(
    expected instanceof RegExp ? expected.test(value) : value === expected,
    `${key} is "${value}", expected ${expected}`,
  );
}

// HSTS is only honoured with a preload directive on a domain you control, and
// it is not revocable inside its max-age, so the value is checked explicitly.
const hsts = headers['strict-transport-security'] ?? '';
check(/includeSubDomains/.test(hsts), 'Strict-Transport-Security should include subdomains');
check(/preload/.test(hsts), 'Strict-Transport-Security should request preload');

check(Boolean(headers['cross-origin-opener-policy']), 'missing Cross-Origin-Opener-Policy');

// --- The Content Security Policy -------------------------------------------
const csp = headers['content-security-policy'];
check(Boolean(csp), 'missing Content-Security-Policy');
if (csp) {
  const directives = Object.fromEntries(
    csp.split(';').map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values];
    }),
  );

  for (const directive of ['default-src', 'script-src', 'style-src', 'object-src', 'base-uri', 'frame-ancestors']) {
    check(Boolean(directives[directive]), `CSP has no ${directive} directive`);
  }

  // The point of this exercise: no exceptions.
  check(
    !directives['script-src']?.includes("'unsafe-inline'"),
    "script-src contains 'unsafe-inline', which removes the protection it appears to provide",
  );
  check(
    !directives['script-src']?.includes("'unsafe-eval'"),
    "script-src contains 'unsafe-eval'",
  );
  check(
    !directives['style-src']?.includes("'unsafe-inline'"),
    "style-src contains 'unsafe-inline'",
  );
  check(
    directives['script-src']?.every((v) => v === "'self'"),
    `script-src is ${JSON.stringify(directives['script-src'])}, expected only 'self'`,
  );
  check(
    directives['object-src']?.includes("'none'"),
    "object-src should be 'none'",
  );
  check(
    directives['base-uri']?.includes("'self'"),
    "base-uri should be 'self'",
  );
}

// --- Caching ----------------------------------------------------------------
const assets = vercel.headers?.find((rule) => rule.source === '/assets/(.*)');
check(Boolean(assets), 'no immutable caching rule for hashed assets');
if (assets) {
  const cache = assets.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value ?? '';
  check(/immutable/.test(cache), 'hashed assets are not cached immutably');
  check(/max-age=31536000/.test(cache), 'hashed assets do not get a one-year cache');
}

if (failures.length) {
  console.error(`security headers: ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('security headers: ok — CSP with no unsafe directives, HSTS with preload, immutable asset caching');
