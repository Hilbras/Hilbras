"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "hilbras-theme";

function getStoredTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
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
  const [chosen, setChosen] = useState(false);
  const [switches, setSwitches] = useState(0);
  const animationTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (!chosen) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
  }, [theme, chosen]);

  useEffect(() => {
    if (getStoredTheme() !== null) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setTheme(event.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => () => window.clearTimeout(animationTimer.current), []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  function toggleTheme() {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("theme-anim");
      window.clearTimeout(animationTimer.current);
      animationTimer.current = window.setTimeout(() => {
        document.documentElement.classList.remove("theme-anim");
      }, 450);
    }
    setChosen(true);
    setTheme(nextTheme);
    setSwitches((count) => count + 1);
  }

  return (
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
