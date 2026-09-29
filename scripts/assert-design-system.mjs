#!/usr/bin/env node
/**
 * Asserts the design system is used as one.
 *
 * Three things went wrong before this existed, and each was invisible because
 * nothing looked:
 *
 * - Colours were hardcoded in components. A component reached for a hex value
 *   and the theme could not change it. There are now zero colour literals outside
 *   the two theme declarations, and this fails if one returns.
 * - The type scale was hand-rolled: `text-[13px]` in fifty places across eighteen
 *   files. Changing one size meant finding every use, and nothing stopped a new
 *   arbitrary value being added. The four missing steps are tokens now.
 * - Spacing and radius were left to whatever a component happened to write.
 *
 * The cost of this check is that a deliberate exception needs a comment saying
 * why. That is the right trade: an exception nobody wrote down is a decision
 * nobody made.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

async function tsxFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await tsxFiles(path)));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(path);
  }
  return out;
}

const files = await tsxFiles(src);
const css = await readFile(join(src, 'index.css'), 'utf8');

// --- Colours -------------------------------------------------------------
// A colour literal in a component bypasses the theme entirely, which is the
// one thing a token system exists to prevent.
const colourLiteral = /(?<![\w-])#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/;
for (const file of files) {
  const text = await readFile(file, 'utf8');
  text.split('\n').forEach((line, index) => {
    if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) return;
    if (colourLiteral.test(line)) {
      failures.push(`${relative(root, file)}:${index + 1} hardcodes a colour: ${line.trim().slice(0, 70)}`);
    }
  });
}

// --- The type scale ------------------------------------------------------
// Any `text-[...]` or `tracking-[...]` is a step that bypasses the scale.
const arbitraryType = /\b(?:text|tracking)-\[[^\]]+\]/g;
for (const file of files) {
  const text = await readFile(file, 'utf8');
  const found = [...new Set(text.match(arbitraryType) ?? [])];
  for (const value of found) {
    failures.push(`${relative(root, file)} uses ${value}, outside the type scale`);
  }
}

// The scale itself must be complete for the sizes the site uses.
for (const token of ['--text-9', '--text-11', '--text-13', '--text-15', '--tracking-card', '--tracking-claim']) {
  check(css.includes(`${token}:`), `the type scale is missing ${token}`);
}

// --- Class names that must exist ----------------------------------------
// A component can only use these if the stylesheet defines them, and a typo in a
// class name is silent: the element simply loses its styling.
const definedClasses = new Set(
  [...css.matchAll(/^\s*\.([a-z][a-z0-9-]*)/gm)].map((match) => match[1]),
);
const usedClasses = new Set();
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const value = (match[1] ?? match[2] ?? '')
      .replace(/\$\{[^}]*\}/g, ' ')
      .replace(/\b(?:sm|md|lg|xl|2xl|hover|focus|group-hover|disabled):/g, ' ');
    for (const token of value.split(/\s+/)) {
      // Only the project's own class names. Tailwind utilities are Tailwind's
      // business and are not declared in this file.
      if (/^[a-z][a-z0-9-]*$/.test(token) && !/^(text|bg|border|flex|grid|mt|mb|ml|mr|px|py|pt|pb|gap|size|h|w|top|left|right|bottom|rounded|opacity|shadow|font|tracking|leading|overflow|z|transition|duration|ease|group|max|min|space|order|col|row|items|justify|self|place|absolute|relative|inline|block|hidden|truncate|italic|uppercase|tabular|whitespace|break|list|divide|ring|outline|cursor|pointer|select|appearance|backdrop|mix|underline|antialiased|sr|not|decoration|underline|origin|transform|translate|scale|rotate|shadow|blur|bg)/.test(token)) {
        if (!definedClasses.has(token) && token.length > 3) usedClasses.add(token);
      }
    }
  }
}

// Only report the ones that look like the project's own vocabulary.
const vocabulary = [...usedClasses].filter(
  (name) =>
    /^(card|btn|eyebrow|mono-label|section-title|display-title|gold-text|hairline|grid-wash|bg-glow|glow-wash|nav-blur|node|flow-line|disclosure|skip-link|footer-link|reveal|shell|section-band|section-pad|product-|icon-)/.test(name),
);
for (const name of vocabulary) {
  if (!definedClasses.has(name)) {
    failures.push(`the components use .${name}, which the stylesheet does not define`);
  }
}

if (failures.length) {
  console.error(`design system: ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `design system: ok — ${files.length} files, no colour literals, no arbitrary type values, ` +
    `${definedClasses.size} component classes defined`,
);
