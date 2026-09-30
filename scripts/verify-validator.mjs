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
const dataFile = (name) => join(root, 'src', 'data', `${name}.ts`);

/**
 * The files a case may break, and their committed contents.
 *
 * This used to be a single hardcoded `areas.ts`, which meant every rule the
 * validator enforces over `site.ts` — dead navigation links, missing vision
 * stages, an empty audience list — had no self-test at all. A rule nobody has
 * seen reject anything is a rule nobody trusts, and that applies to the whole
 * validator, not just the part that reads the product registry.
 */
const FILES = ['areas', 'site', 'stages', 'marks'];
const originals = new Map();
for (const name of FILES) originals.set(name, await readFile(dataFile(name), 'utf8'));

const areasFile = dataFile('areas');

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
  // The next three are the second line of defence. `tsc` rejects a product
  // naming a mark or a band that does not exist, so these cases cast the value
  // to silence the compiler — which is exactly what someone does when they want
  // the build to go through. The validator reads the compiled bundle, so it is
  // what catches them.
  {
    name: 'product naming a mark nobody drew',
    expect: 'invalid-mark-reference',
    // The Security *area* also draws a shield, and a plain string replace takes
    // the first hit — which would be the area, not the product. Anchoring on the
    // product's own id is what makes this case test what it claims to.
    mutate: (s) => s.replace(/(id: 'spectra',[\s\S]*?)mark: 'shield',/, "$1mark: 'compass' as MarkId,"),
  },
  {
    name: 'product in a band that does not exist',
    expect: 'invalid-stage-reference',
    mutate: (s) => s.replace("    stage: 'environment',", "    stage: 'spacetime' as StageId,"),
  },
  {
    name: 'two products sharing a mark',
    expect: 'duplicate-product-mark',
    mutate: (s) => s.replace("    mark: 'terminal',", "    mark: 'branches',"),
  },
  {
    // A navigation link to a page that does not exist. Before the rule was
    // widened this reported "has no matching section id", which is a
    // true-sounding complaint about a link that was pointing at a real page.
    name: 'navigation link to a page that does not exist',
    file: 'site',
    expect: 'is not a route',
    mutate: (s) => s.replace("{ href: '/developers', label: 'Developers' },", "{ href: '/nowhere', label: 'Developers' },"),
  },
  {
    name: 'a section link with no matching section',
    file: 'site',
    expect: 'has no matching section id',
    mutate: (s) => s.replace("{ href: '/#ecosystem', label: 'Ecosystem' }", "{ href: '/#nowhere', label: 'Ecosystem' }"),
  },
  {
    name: 'a section link that is not root-relative',
    file: 'site',
    expect: 'resolves against the current page',
    mutate: (s) => s.replace("{ href: '/#ecosystem', label: 'Ecosystem' }", "{ href: '#ecosystem', label: 'Ecosystem' }"),
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
  const file = testCase.file ?? 'areas';
  const original = originals.get(file);
  const target = dataFile(file);
  const mutated = testCase.mutate(original);

  // A case whose mutation changed nothing has silently stopped testing anything,
  // and would report "the validator missed a defect" for a rule that was never
  // broken. That is the worst possible failure for a self-test, so it is called
  // out separately: adding or renaming a product moves these anchors, and the
  // fix is to repoint the case, not to assume the check still works.
  if (mutated === original) {
    results.push({
      ...testCase,
      outcome: 'STALE ANCHOR',
      detail: 'the mutation changed nothing, so this case is no longer testing anything — repoint it at the current data',
    });
    continue;
  }

  await writeFile(target, mutated, 'utf8');
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
    await writeFile(target, original, 'utf8');
  }
}

for (const name of FILES) await writeFile(dataFile(name), originals.get(name), 'utf8');
await build();
await check();

console.log('\nvalidator self-test\n');
for (const r of results) {
  const mark = r.outcome === 'caught' ? 'PASS' : r.outcome === 'STALE ANCHOR' ? 'STALE' : 'FAIL';
  console.log(`  ${mark}  ${r.name}`);
  if (r.outcome !== 'caught') console.log(`        ${r.detail ?? ''}`);
}
const failed = results.filter((r) => r.outcome !== 'caught').length;
console.log(`\n  ${results.length - failed}/${results.length} cases caught\n`);
process.exit(failed ? 1 : 0);
