#!/usr/bin/env node
/**
 * Proves the build-output assertion catches a broken prerender.
 *
 * The failure this guards against is silent: every other check passes, the build
 * succeeds, and the site serves a document with no content in it. A guard that
 * has never been seen to fire is a guard nobody should trust, so this corrupts
 * the built document three ways and asserts each is rejected.
 *
 * Run with: node scripts/verify-build-assertion.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'dist', 'index.html');
const original = await readFile(target, 'utf8');

const cases = [
  {
    name: 'the prerender injected nothing',
    expect: 'prerender step did not inject',
    mutate: (html) => html.replace(/<div id="root">[\s\S]*?<\/div>\s*<noscript>/, '<div id="root"></div><noscript>'),
  },
  {
    name: 'the canonical points somewhere else',
    expect: 'canonical is',
    mutate: (html) => html.replace(/rel="canonical" href="[^"]+"/, 'rel="canonical" href="https://example.com/"'),
  },
  {
    name: 'a stale domain survived a migration',
    // A product link pointing at a host that is not in the data is exactly what
    // a half-finished domain migration leaves behind.
    expect: 'unexpected external origin',
    mutate: (html) => html.replaceAll('https://hilbras-studio.vercel.app', 'https://studio.hilbras-old.com'),
  },
  {
    name: 'the JSON-LD was removed',
    expect: 'expected one JSON-LD block',
    mutate: (html) => html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ''),
  },
  {
    name: 'a heading level was skipped',
    expect: 'an h4 appears without an h3',
    mutate: (html) => html.replace('<h3 class="text-lg font-semibold', '<h4 class="text-lg font-semibold'),
  },
  {
    name: 'an inline script was reintroduced',
    expect: 'inline script was reintroduced',
    mutate: (html) => html.replace('<script src="/theme-init.js"></script>', '<script>console.log(1)</script>'),
  },
];

const results = [];

for (const testCase of cases) {
  await writeFile(target, testCase.mutate(original), 'utf8');
  try {
    await run('node', ['scripts/assert-build-output.mjs'], { cwd: root });
    results.push({ ...testCase, outcome: 'NOT CAUGHT' });
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    results.push({
      ...testCase,
      outcome: output.includes(testCase.expect) ? 'caught' : `caught, but not as "${testCase.expect}"`,
      detail: output.trim().split('\n').filter(Boolean).pop(),
    });
  } finally {
    await writeFile(target, original, 'utf8');
  }
}

await writeFile(target, original, 'utf8');

console.log('\nbuild-assertion self-test\n');
for (const r of results) {
  console.log(`  ${r.outcome === 'caught' ? 'PASS' : 'FAIL'}  ${r.name}`);
  if (r.outcome !== 'caught') console.log(`        ${r.detail ?? ''}`);
}
const failed = results.filter((r) => r.outcome !== 'caught').length;
console.log(`\n  ${results.length - failed}/${results.length} cases caught\n`);
process.exit(failed ? 1 : 0);
