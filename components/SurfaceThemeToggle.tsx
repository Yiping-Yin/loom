'use client';

import { useEffect, useState } from 'react';

const KEY = 'loom.surface.theme';
type SurfaceTheme = 'dark' | 'light';

/**
 * Product-wide light / dark toggle for CONTENT surfaces (Studio, settings, …).
 *
 * Sets `data-surface-theme` on <body> — which flips the canonical premium-white token
 * overrides in globals.css — and REMOVES it on unmount. Because the attribute only
 * exists while a surface that mounts this toggle is on screen, the dark cosmic art
 * pages (landing / history / dossier cover) are never touched: light is opt-in per
 * surface, never a global default that has to be pinned back to dark.
 */
export function SurfaceThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<SurfaceTheme>('dark');

  useEffect(() => {
    let saved: SurfaceTheme = 'dark';
    try {
      if (window.localStorage.getItem(KEY) === 'light') saved = 'light';
    } catch {
      /* no-op */
    }
    setTheme(saved);
    document.body.dataset.surfaceTheme = saved;
    return () => {
      delete document.body.dataset.surfaceTheme;
    };
  }, []);

  const toggle = () => {
    const next: SurfaceTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.body.dataset.surfaceTheme = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* no-op */
    }
  };

  return (
    <button
      type="button"
      className={className ?? 'surface-theme-toggle'}
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
