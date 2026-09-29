#!/usr/bin/env node
/**
 * Proves the validator fails on the defects it claims to catch.
 *
 * A validator nobody has seen reject anything is a validator nobody trusts. This
 * takes the real data, breaks one rule at a time, and asserts the build fails
 * with the expected code.
 *
 * Run with: node scripts/verify-validator.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const areasFile = join(root, 'src', 'data', 'areas.ts');
const original = await readFile(areasFile, 'utf8');

/** Each case breaks the data in one specific way. */
const cases = [
  {
    name: 'duplicate product id',
    expect: 'duplicate-product-id',
    mutate: (s) => s.replace("    id: 'hilgit',", "    id: 'code',"),
  },
  {
    name: 'product references a nonexistent area',
    expect: 'invalid-area-reference',
    mutate: (s) => s.replace("    area: 'computing',", "    area: 'quantum',"),
  },
  {
    name: 'area lists a product that does not exist',
    expect: 'dangling-area-reference',
    mutate: (s) => s.replace("products: ['keystone', 'code', 'hilgit']", "products: ['keystone', 'code', 'hilgit', 'ghostware']"),
  },
  {
    name: 'repository outside the Hilbras org',
    expect: 'invalid-repository-url',
    mutate: (s) => s.replace("repository: 'https://github.com/Hilbras/Spectra',", "repository: 'https://gitlab.com/someone/spectra',"),
  },
  {
    name: 'relative product href',
    expect: 'invalid-product-url',
    mutate: (s) => s.replace("href: 'https://hilbras-studio.vercel.app',", "href: '/studio',"),
  },
  {
    name: 'stable product with no public release',
    expect: 'stable-without-release',
    mutate: (s) => s.replace("    repository: 'https://github.com/Hilbras/Hilbras-ai-sdk',", "    repository: undefined,"),
  },
  {
    name: 'product with an unknown kind',
    expect: 'unknown-kind',
    mutate: (s) => s.replace("    kind: 'system',", "    kind: 'gadget',"),
  },
  {
    name: 'product left out of every area',
    expect: 'orphan-product',
    mutate: (s) =>
      s
        .replace("products: ['keystone', 'code', 'hilgit']", "products: ['keystone', 'code']")
        .replace("products: ['hilgit', 'studio', 'hilpress']", "products: ['studio', 'hilpress']"),
  },
  {
    name: 'summary identical to description',
    expect: 'redundant-summary',
    mutate: (s) => s.replace(
      "    summary: 'A modular security testing and analysis platform.',",
      "    summary: 'A modular, extensible security testing and analysis platform — a 21-crate Rust workspace covering target management, discovery, fingerprinting, scanning, verification, and reporting.',",
    ),
  },
];

const build = () => run('pnpm', ['build:server'], { cwd: root, maxBuffer: 1 << 24 });
const check = () => run('node', ['scripts/validate-data.mjs'], { cwd: root, maxBuffer: 1 << 24 });

await build();
const results = [];

for (const testCase of cases) {
  await writeFile(areasFile, testCase.mutate(original), 'utf8');
  try {
    await build();
    const { stdout, stderr } = await check();
    const output = `${stdout ?? ''}${stderr ?? ''}`;
    results.push(
      output.includes(testCase.expect)
        ? { ...testCase, outcome: 'caught' }
        : { ...testCase, outcome: 'NOT CAUGHT', detail: output.trim() || '(no output)' },
    );
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    const caught = output.includes(testCase.expect);
    results.push({ ...testCase, outcome: caught ? 'caught' : `caught, but not as ${testCase.expect}`, detail: output.trim().split('\n').find((l) => l.includes(testCase.expect)) ?? output.trim().split('\n').slice(-1)[0] });
  } finally {
    await writeFile(areasFile, original, 'utf8');
  }
}

await writeFile(areasFile, original, 'utf8');
await build();
await check();

console.log('\nvalidator self-test\n');
for (const r of results) {
  console.log(`  ${r.outcome === 'caught' ? 'PASS' : 'FAIL'}  ${r.name}`);
  if (r.outcome !== 'caught') console.log(`        ${r.detail ?? ''}`);
}
const failed = results.filter((r) => r.outcome !== 'caught').length;
console.log(`\n  ${results.length - failed}/${results.length} cases caught\n`);
process.exit(failed ? 1 : 0);
