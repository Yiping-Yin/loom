'use client';
/**
 * First-run soft prompt: shown at the top of user-work surfaces (Home, Today,
 * Browse, Knowledge) when no Anthropic API key is configured. Hidden once the
 * user sets a key in Settings, or dismisses the banner.
 *
 * Per the "Learn, Don't Organize" north star and Focus Discipline memory, this
 * is a soft prompt, not a hard gate — the reading loop works without AI, so
 * the banner never blocks primary work. It only nudges. Dismissal persists per
 * session (sessionStorage) so it doesn't re-appear every navigation.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isNativeMode } from '../lib/is-native-mode';

const DISMISS_KEY = 'loom:ai-key-banner-dismissed';

function isReadingPath(pathname: string) {
  return (
    pathname.startsWith('/wiki/') ||
    pathname.startsWith('/knowledge/') ||
    pathname.startsWith('/uploads/')
  );
}

function isPresentationPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/loom' ||
    pathname === '/product-history' ||
    pathname === '/about' ||
    pathname === '/education' ||
    pathname === '/experience' ||
    pathname === '/digital-me'
  );
}

export function AiKeyMissingBanner() {
  const pathname = usePathname() ?? '/';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    // Native shell handles provider + key setup via FirstRunProviderSheet
    // and AIProviderSettingsView; the banner becomes redundant chrome there
    // and `/api/ai-key-status` doesn't exist under static export anyway.
    if (isNativeMode()) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ai-key-status', { cache: 'no-store' });
        if (!res.ok) return;
        const payload = (await res.json()) as { anthropic?: string };
        if (!cancelled && payload.anthropic === 'unset') {
          setVisible(true);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Don't show on pure reading surfaces or presentation pages. Those
  // surfaces should open cleanly before provider setup becomes relevant.
  if (!visible || isPresentationPath(pathname) || isReadingPath(pathname)) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setVisible(false);
  };

  return (
    <div
      role="status"
      style={{
        borderBottom: '0.5px solid color-mix(in srgb, var(--accent) 18%, var(--mat-border))',
        background: 'color-mix(in srgb, var(--accent-soft) 12%, var(--mat-thin-bg))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
          maxWidth: '76rem',
          margin: '0 auto',
          padding: '0.52rem clamp(1.1rem, 4vw, 4rem)',
          fontSize: 'var(--fs-small)',
          color: 'var(--fg-secondary)',
        }}
      >
        <span aria-hidden style={statusDotStyle} />
        <span style={{ flex: 1, minWidth: 0 }}>
          AI features are off. Add an Anthropic API key in Settings (<kbd style={kbdStyle}>⌘</kbd><kbd style={kbdStyle}>,</kbd>). Sources and reading still work.
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: 'var(--fs-small)',
            borderRadius: 'var(--r-1)',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

const statusDotStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 7,
  height: 7,
  borderRadius: 999,
  background: 'var(--fg-secondary)',
  flex: '0 0 auto',
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  margin: '0 1px',
  fontFamily: 'var(--mono)',
  fontSize: 'var(--fs-caption)',
  border: '0.5px solid var(--mat-border)',
  borderRadius: 4,
  background: 'var(--mat-thin-bg)',
};
