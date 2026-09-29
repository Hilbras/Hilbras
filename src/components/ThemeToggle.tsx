import { useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'hilbras-theme';

/**
 * No `document` during the prerender pass. The inline head script has already
 * applied the stored theme before first paint, so the server simply renders the
 * default and the correct icon appears with the stylesheet.
 */
function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function MoonSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className="theme-icon-light h-4 w-4">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="m20 2 1.1 1.9L23 5l-1.9 1.1L20 8l-1.1-1.9L17 5l1.9-1.1L20 2Z" />
    </svg>
  );
}

function SunSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className="theme-icon-dark h-4 w-4">
      <circle cx="12" cy="12" r="3.6" />
      <path d="m12 1.6 1.6 3L12 7.6l-1.6-3 1.6-3Z" />
      <path d="m12 16.4 1.6 3-1.6 3-1.6-3 1.6-3Z" />
      <path d="m1.6 12 3-1.6 3 1.6-3 1.6-3-1.6Z" />
      <path d="m16.4 12 3-1.6 3 1.6-3 1.6-3-1.6Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getTheme);
  // Bumped on every switch to remount the icon and replay its entrance. It is
  // 0 on the server and on the first client render, so the two trees agree.
  const [switches, setSwitches] = useState(0);
  const animationTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => () => window.clearTimeout(animationTimer.current), []);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  function toggleTheme() {
    // The 350ms colour transition is scoped to this moment only, so a normal
    // page scroll never inherits it. Skipped under reduced motion, where the
    // animation is already off.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('theme-anim');
      window.clearTimeout(animationTimer.current);
      animationTimer.current = window.setTimeout(() => {
        document.documentElement.classList.remove('theme-anim');
      }, 450);
    }
    setTheme(nextTheme);
    setSwitches((count) => count + 1);
  }

  return (
    // Both icons are always in the DOM and CSS picks one from `data-theme`, so
    // the server and client trees are identical. That matters for more than
    // tidiness: rendering the icon from JavaScript state made the two trees
    // disagree whenever the stored theme was light, and React tore down the
    // whole hydrated tree over it.
    //
    // The label is deliberately static. A "Switch to X theme" label would depend
    // on localStorage, and React does not patch a mismatched attribute after
    // hydration — the button would sit there mislabelled until it was clicked.
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
      className="theme-toggle relative grid h-9 w-9 place-items-center rounded-full"
    >
      <span key={switches} className="theme-icon grid place-items-center">
        <MoonSparkle />
        <SunSparkle />
      </span>
    </button>
  );
}
