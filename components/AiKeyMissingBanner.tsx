'use client';
/**
 * First-run soft prompt: shown as low-priority glass toast on user-work
 * surfaces when no Anthropic API key is configured. Hidden once the user sets
 * a key in Settings, or dismisses the banner.
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
    pathname === '/sources' ||
    pathname === '/draft' ||
    pathname === '/drafts' ||
    pathname === '/loom' ||
    pathname === '/reflection' ||
    pathname === '/product-history' ||
    pathname === '/help' ||
    pathname === '/offline' ||
    pathname === '/onboarding' ||
    pathname === '/system' ||
    pathname === '/discipline' ||
    pathname === '/year' ||
    pathname === '/hour' ||
    pathname === '/connections' ||
    pathname === '/colophon' ||
    pathname === '/llm-wiki' ||
    pathname === '/quizzes' ||
    pathname === '/doc' ||
    pathname === '/panel' ||
    pathname.startsWith('/panel/') ||
    pathname === '/pursuit' ||
    pathname.startsWith('/pursuit/') ||
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

  const shouldShow = visible && !isPresentationPath(pathname) && !isReadingPath(pathname);

  // Don't show on pure reading, source-library landing, or presentation pages.
  // Those surfaces should open cleanly before provider setup becomes relevant.
  if (!shouldShow) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setVisible(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="loom-ai-key-banner"
      data-ai-key-banner="true"
      style={{
        position: 'fixed',
        right: 'max(1rem, env(safe-area-inset-right))',
        bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        zIndex: 920,
        boxSizing: 'border-box',
        width: 'fit-content',
        maxWidth: 'min(25rem, calc(100vw - 2rem))',
        border: '0.5px solid color-mix(in srgb, var(--accent) 16%, var(--mat-border))',
        borderRadius: '999px',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--mat-thin-bg) 90%, transparent), color-mix(in srgb, var(--accent-soft) 8%, var(--mat-bg)))',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 30px rgba(0,0,0,0.26)',
        WebkitBackdropFilter: 'blur(22px) saturate(118%)',
        backdropFilter: 'blur(22px) saturate(118%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          minWidth: 0,
          padding: '0.44rem 0.62rem',
          fontSize: 'clamp(0.72rem, 2.6vw, var(--fs-small))',
          color: 'var(--fg-secondary)',
          lineHeight: 1.2,
        }}
      >
        <span aria-hidden style={statusDotStyle} />
        <span
          className="loom-ai-key-banner__copy"
          title="AI off. Add a key in Settings; Sources and Draft still work."
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          AI off. Add a key in Settings; Sources and Draft still work.
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss AI key notice"
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
            flex: '0 0 auto',
            padding: '2px 5px',
            fontSize: 'clamp(0.72rem, 2.6vw, var(--fs-small))',
            borderRadius: '999px',
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
  width: 6,
  height: 6,
  borderRadius: 999,
  background: 'var(--fg-secondary)',
  flex: '0 0 auto',
};
