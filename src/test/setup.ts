import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

/**
 * happy-dom has no `matchMedia`, and both the theme logic and the particle field
 * read it. A stub that reports "no preference" and "no dark" is the common case
 * and the one worth testing against; individual tests override it.
 */
function stubMatchMedia(matches: { dark?: boolean; reduce?: boolean } = {}) {
  return (query: string): MediaQueryList => {
    const dark = matches.dark ?? false;
    const reduce = matches.reduce ?? false;
    const matchesQuery =
      query.includes('prefers-color-scheme: dark') ? dark
      : query.includes('prefers-reduced-motion: reduce') ? reduce
      : false;
    return {
      matches: matchesQuery,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  };
}

beforeEach(() => {
  window.matchMedia = stubMatchMedia() as typeof window.matchMedia;
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('has-js');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Reads the resolved value of a CSS custom property, which is how the canvas
 *  and the stylesheet both obtain the accent colour. */
export function cssToken(name: string, fallback = ''): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
