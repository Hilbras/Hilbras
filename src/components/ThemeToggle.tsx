import { useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'hilbras-theme';

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function MoonSparkle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="m20 2 1.1 1.9L23 5l-1.9 1.1L20 8l-1.1-1.9L17 5l1.9-1.1L20 2Z" />
    </svg>
  );
}

function SunSparkle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
  const icon = theme === 'light' ? <MoonSparkle /> : <SunSparkle />;

  function toggleTheme() {
    // The 350ms colour transition is scoped to this moment only, so a normal
    // page scroll never inherits it. Skipped entirely under reduced motion,
    // where the CSS animation is already off.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('theme-anim');
      window.clearTimeout(animationTimer.current);
      animationTimer.current = window.setTimeout(() => {
        document.documentElement.classList.remove('theme-anim');
      }, 450);
    }
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className="theme-toggle relative grid h-9 w-9 place-items-center rounded-full"
    >
      {/* Keyed so the icon re-mounts and replays its entrance on every switch. */}
      <span key={theme} className="theme-icon grid place-items-center">
        {icon}
      </span>
    </button>
  );
}
