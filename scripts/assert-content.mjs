#!/usr/bin/env node
/**
 * Rewrites the counts a visitor can read so they come from the data.
 *
 * "Six areas. One company." and "eleven products" were typed into copy. Adding a
 * product left the second one wrong with nothing to notice. This runs as a check
 * rather than a build step: it reports drift, and the fix is a one-line edit to
 * the copy, which is a decision rather than something to automate away.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const areas = await readFile(join(root, 'src/data/areas.ts'), 'utf8');
const site = await readFile(join(root, 'src/data/site.ts'), 'utf8');

const areasFile = await readFile(join(root, 'src/data/areas.ts'), 'utf8');

// The two arrays have to be counted separately: both open with the same shape.
const areasBlock = areasFile.slice(areasFile.indexOf('export const areas'), areasFile.indexOf('export const products'));
const productsBlock = areasFile.slice(areasFile.indexOf('export const products'));
const areaCount = (areasBlock.match(/^    id: '/gm) ?? []).length;
const productCount = (productsBlock.match(/^    id: '/gm) ?? []).length;
const featuredCount = (productsBlock.match(/featured: true/g) ?? []).length;
const principleCount = (site.match(/^    number: '\d\d',$/gm) ?? []).length;
const audienceCount = (site.match(/^    id: '(developers|businesses|creators)',$/gm) ?? []).length;

const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const spelled = (n) => words[n] ?? String(n);
// Headings start a sentence, so the numeral is capitalised there.
const Sentence = (n) => {
  const word = spelled(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
};

const expectations = [
  { file: 'src/components/Ecosystem.tsx', pattern: /title="(\w+) areas\. One company\."/, expected: Sentence(areaCount), what: 'the ecosystem heading' },
  { file: 'src/components/Philosophy.tsx', pattern: /title="(\w+) commitments we can be held to\."/, expected: Sentence(principleCount), what: 'the philosophy heading' },
  { file: 'src/components/Audiences.tsx', pattern: /title="(\w+) audiences, three different entry points\."/, expected: Sentence(audienceCount), what: 'the audiences heading' },
  { file: 'src/components/Products.tsx', pattern: /lede="(\w+) products lead the ecosystem today\./, expected: Sentence(featuredCount), what: 'the products lede' },
  { file: 'src/components/Hero.tsx', pattern: />(\w+) technology areas · (\w+) products</, expected: [spelled(areaCount), spelled(productCount)], what: 'the hero panel count' },
];

const problems = [];

for (const check of expectations) {
  const file = await readFile(join(root, check.file), 'utf8');
  const match = file.match(check.pattern);
  if (!match) {
    problems.push(`${check.file}: could not find ${check.what} to check`);
    continue;
  }
  const found = Array.isArray(check.expected) ? match.slice(1) : [match[1]];
  const wanted = Array.isArray(check.expected) ? check.expected : [check.expected];
  if (found.join(' ') !== wanted.join(' ')) {
    problems.push(`${check.file}: ${check.what} says "${found.join(' ')}" but the data says "${wanted.join(' ')}"`);
  }
}

if (problems.length) {
  console.error(`content: ${problems.length} count(s) out of step with the data\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\n  Either update the copy, or remove the number from the sentence.\n');
  process.exit(1);
}

console.log(
  `content: counts consistent — ${areaCount} areas, ${productCount} products, ` +
    `${featuredCount} featured, ${principleCount} principles, ${audienceCount} audiences`,
);
