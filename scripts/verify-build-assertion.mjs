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
    // A product with a very long name pushes its title past what a search
    // result shows. The template drops the brand suffix, which helps, but it
    // will not mangle a name to fit — so the assertion has to be the thing that
    // reports it.
    name: 'a title too long for a search result to show',
    expect: 'past the',
    mutate: (html) => html.replace(/<title>[\s\S]*?<\/title>/, `<title>${'Hilbras '.repeat(14)}Omniversal Distributed Infrastructure Coordination Fabric — Hilbras</title>`),
  },
  {
    name: 'a description too long for a search result to show',
    expect: 'past the',
    mutate: (html) => html.replace(
      /(<meta\s+name="description"\s+content=")[^"]*"/,
      (_m, head) => `${head}${'a very long description '.repeat(12).trim()}"`,
    ),
  },
  {
    name: 'a URL in prose, which is content and not a claim',
    // The mirror of the stale-domain case: a URL inside a sentence is content,
    // not a claim about where something lives, and must NOT be reported.
    // Asserting only that a check fires leaves no way to tell a strict check
    // from a broken one that fires at everything — so this case exists.
    expect: 'build output: ok',
    expectPass: true,
    // In body prose, not the meta description: the meta has its own assertions
    // (it must match the generated one, and it has a length budget), so
    // injecting there would trip those and this case would test something else.
    mutate: (html) => html.replace('</main>', '<p>Read https://a.io/x?b=2 for details.</p></main>'),
  },
  {
    name: 'an inline script was reintroduced',
    expect: 'inline script was reintroduced',
    mutate: (html) => html.replace('<script src="/theme-init.js"></script>', '<script>console.log(1)</script>'),
  },
];

const results = [];

for (const testCase of cases) {
  const mutated = testCase.mutate(original);
  if (mutated === original) {
    results.push({
      ...testCase,
      outcome: 'STALE ANCHOR',
      detail: 'the mutation changed nothing, so this case is no longer testing anything',
    });
    continue;
  }
  await writeFile(target, mutated, 'utf8');
  try {
    const { stdout, stderr } = await run('node', ['scripts/assert-build-output.mjs'], { cwd: root });
    const output = `${stdout ?? ''}${stderr ?? ''}`;
    // A negative case asserts the check stays quiet. Without this, a check that
    // fired at everything would pass every positive case and score full marks.
    results.push({
      ...testCase,
      outcome: testCase.expectPass ? (output.includes(testCase.expect) ? 'caught' : 'OVER-REPORTED') : 'NOT CAUGHT',
      detail: testCase.expectPass && !output.includes(testCase.expect) ? output.trim().split('\n').filter(Boolean).slice(0, 3).join(' | ') : undefined,
    });
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
