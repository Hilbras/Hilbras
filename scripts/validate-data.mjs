#!/usr/bin/env node
/**
 * Fails the build when the data layer is inconsistent.
 *
 * Runs after the SSR build because it imports the same compiled module, so it
 * validates exactly what is about to be prerendered rather than a second,
 * possibly different, compilation of it.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ssrEntry = join(root, '.ssr', 'entry-server.mjs');

const { validateData, formatIssues } = await import(ssrEntry);
const issues = validateData();

const errors = issues.filter((issue) => issue.severity === 'error');
const warnings = issues.filter((issue) => issue.severity === 'warning');

if (warnings.length) console.warn(`validate: ${warnings.length} warning(s)\n${formatIssues(warnings)}`);

if (errors.length) {
  console.error(`validate: ${errors.length} error(s)\n${formatIssues(errors)}`);
  process.exit(1);
}

console.log('validate: data layer consistent');
