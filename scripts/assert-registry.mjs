#!/usr/bin/env node
/**
 * Fails when a version the site publishes is not the one on the registry.
 *
 * The data layer records every npm package with a version and the date it was
 * read. Nothing until now could check the version was still current: on
 * 2026-10-27 the site advertised @hilbras/sdk 3.2.0 against 3.7.0 on npm,
 * keystone 3.3.x against 4.0.1, and an install command for a package with no
 * published versions at all. Every one of those passed `pnpm check`, because
 * "is a semver" and "is the published one" are different questions.
 *
 * This reads the compiled SSR bundle for the same reason validate-data.mjs does:
 * it checks the data that is about to be prerendered, not a second copy of it.
 *
 * Needs network. Run with `pnpm assert:registry` after a build, or as part of
 * `pnpm check`; it is kept out of the unit tests so they stay offline.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ssrEntry = join(root, '.ssr', 'entry-server.mjs');

const { products } = await import(ssrEntry);

const REGISTRY = 'https://registry.npmjs.org';
const packages = products.filter((product) => product.developer);

if (packages.length === 0) {
  console.error('assert-registry: no product has a developer block, so nothing was checked');
  process.exit(1);
}

/** The registry document for a package, or null when it is not published. */
async function fetchPackage(name) {
  const url = `${REGISTRY}/${name.replace('/', '%2f')}`;
  // The full document for a package with a long history is megabytes (A
  // lightweight `latest`-only endpoint does not exist on npm's public registry,
  // so the abbreviated form is requested instead). npm answers either way; the
  // abbreviated response omits version metadata this check does not read.
  const response = await fetch(url, {
    headers: { accept: 'application/vnd.npm.install-v1+json, application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${name}: registry answered ${response.status}`);
  return response.json();
}

const failures = [];
const results = await Promise.allSettled(packages.map((product) => fetchPackage(product.developer.package)));

results.forEach((result, index) => {
  const product = packages[index];
  const { package: name, version, verified } = product.developer;

  if (result.status === 'rejected') {
    failures.push(`${product.id}: could not reach the registry for ${name} (${result.reason.message})`);
    return;
  }

  const doc = result.value;
  if (!doc) {
    failures.push(
      `${product.id}: the site publishes \`npm install\` for ${name}, but the package does not exist on npm`,
    );
    return;
  }

  const latest = doc['dist-tags']?.latest;
  if (!latest) {
    failures.push(`${product.id}: ${name} is on npm but publishes no \`latest\` tag`);
    return;
  }

  if (latest !== version) {
    failures.push(
      `${product.id}: the site says ${name}@${version} (read ${verified}), npm publishes ${latest}`,
    );
  }
});

if (failures.length) {
  console.error(
    `assert-registry: ${failures.length} package(s) disagree with npm\n` +
      failures.map((line) => `  ${line}`).join('\n') +
      '\n  Update src/data/areas.ts, and set `verified` to the date you read them.',
  );
  process.exit(1);
}

console.log(`assert-registry: ${packages.length} package(s) match npm`);
