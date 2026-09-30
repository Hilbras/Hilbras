import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Ecosystem } from './Ecosystem';
import { Philosophy } from './Philosophy';
import { Audiences } from './Audiences';
import { Products } from './Products';
import { Technology } from './Technology';
import { Hero } from './Hero';
import { areas, products } from '../data/areas';
import { counts, sentence, spell } from '../data/site';

/**
 * The counts the page states in prose, checked against the data they describe.
 *
 * These used to be string literals in JSX with a build script that regexed the
 * TSX to compare them. That worked until someone reformatted a line, and it
 * could not distinguish a number that was wrong from a number that had moved.
 *
 * Rendering each section and comparing the result is a statement about the
 * page: it holds regardless of how the markup is formatted, and it fails if a
 * heading ever contradicts the data again.
 */
describe('counts the page states', () => {
  it('derives every count from the data', () => {
    expect(counts.areas).toBe(areas.length);
    expect(counts.products).toBe(products.length);
    expect(counts.featured).toBe(products.filter((p) => p.featured).length);
    expect(counts.others).toBe(products.length - counts.featured);
    expect(counts.othersPublic).toBe(
      products.filter((p) => !p.featured && (p.repository || p.href)).length,
    );
    expect(counts.public).toBe(products.filter((p) => p.repository || p.href).length);
  });

  it('spells and capitalises numbers', () => {
    expect(spell(4)).toBe('four');
    expect(sentence(4)).toBe('Four');
    expect(spell(0)).toBe('zero');
    expect(spell(11)).toBe('eleven');
  });

  // This was a thirteen-entry table that threw above twelve, and a test asserting
  // it threw — so the thirteenth product could not be added and the wall was
  // written into the suite as though it were a property. The company has eleven
  // products and is growing.
  it('spells numbers well past the old limit of twelve', () => {
    expect(spell(13)).toBe('thirteen');
    expect(spell(20)).toBe('twenty');
    expect(spell(21)).toBe('twenty-one');
    expect(spell(40)).toBe('forty');
    expect(spell(99)).toBe('ninety-nine');
    expect(spell(100)).toBe('one hundred');
    expect(spell(113)).toBe('one hundred thirteen');
    expect(sentence(40)).toBe('Forty');
  });

  it('refuses a number it genuinely has no word for', () => {
    // A million is a number nobody has thought about, and guessing a word for it
    // would be a small lie in a heading. This is the one case still worth a
    // build failure.
    expect(() => spell(1_000_000)).toThrow(RangeError);
    expect(() => spell(-1)).toThrow(RangeError);
    expect(() => spell(4.5)).toThrow(RangeError);
  });

  it('states no count it cannot spell', () => {
    for (const [name, value] of Object.entries(counts)) {
      expect(() => spell(value as number), `counts.${name} is ${value}`).not.toThrow();
    }
  });
});

describe('section headings match the data', () => {
  it('names the area count in the ecosystem heading', () => {
    render(<Ecosystem />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      `${sentence(counts.areas)} areas. One company.`,
    );
  });

  it('names the area count in the technology lede', () => {
    render(<Technology />);
    expect(screen.getByText(new RegExp(`^${sentence(counts.areas)} areas, described`))).toBeInTheDocument();
  });

  it('names the principle count in the philosophy heading', () => {
    render(<Philosophy />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      `${sentence(counts.principles)} commitments we can be held to.`,
    );
  });

  it('names the audience count in the audiences heading', () => {
    render(<Audiences />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      `${sentence(counts.audiences)} audiences`,
    );
  });

  it('names the featured and public counts in the products lede', () => {
    render(<Products />);
    const lede = screen.getByText(
      new RegExp(`^${sentence(counts.featured)} products lead the ecosystem today`),
    );
    expect(lede).toHaveTextContent(
      `${spell(counts.othersPublic)} of those ${spell(counts.others)} already have a public repository`,
    );
  });

  it('names the area and product counts in the hero panel', () => {
    render(<Hero />);
    expect(
      screen.getByText(`${spell(counts.areas)} technology areas · ${spell(counts.products)} products`),
    ).toBeInTheDocument();
  });
});

/*
 * A note on what this file deliberately does not do.
 *
 * It would be easy to add a test that scans every heading and lede for numerals
 * and fails on any the data cannot justify. It was written, and it was removed:
 * English uses "one" and "two" as articles and pronouns rather than counts, so
 * it flagged "One company.", "any two of them" and "a 21-crate Rust workspace"
 * as unexplained numbers. A test that reports legitimate prose as a defect gets
 * ignored, and then it catches nothing.
 *
 * The per-section assertions above are the version that works. Each pins a
 * specific number in a specific sentence to its value in `counts`, so if an area
 * is added the heading must read "Seven areas" and the test says so — which is
 * the failure this whole exercise exists to prevent, and it fails loudly on the
 * one line that is wrong.
 */
