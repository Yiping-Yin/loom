'use client';

import { useEffect, useState } from 'react';

const KEY = 'loom.edu.theme';
type EduTheme = 'dark' | 'light';

/**
 * Light / dark toggle, scoped to the Education surfaces. Sets `data-edu-theme` on
 * <body> (which flips the premium-white token overrides in education.module.css) and
 * removes it on unmount, so the dark cosmic surfaces elsewhere are never touched.
 */
export function EduThemeToggle() {
  const [theme, setTheme] = useState<EduTheme>('dark');

  useEffect(() => {
    let saved: EduTheme = 'dark';
    try {
      if (window.localStorage.getItem(KEY) === 'light') saved = 'light';
    } catch {
      /* no-op */
    }
    setTheme(saved);
    document.body.dataset.eduTheme = saved;
    return () => {
      delete document.body.dataset.eduTheme;
    };
  }, []);

  const toggle = () => {
    const next: EduTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.body.dataset.eduTheme = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* no-op */
    }
  };

  return (
    <button
      type="button"
      className="edu-theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
