'use client';
import Link from 'next/link';

import { LoomGlobalNav } from '../components/verified-dossier/LoomGlobalNav';

/**
 * 404 page styled on the design system:
 * - dark cosmic field (--ink-0 / var(--bg))
 * - var(--display) / var(--serif) type
 * - --fg-secondary for muted text (NOT the undefined --text-secondary)
 * - signature-cyan recovery action with :focus-visible ring
 * - LoomGlobalNav mounted
 */
export default function NotFound() {
  return (
    <>
      {/* Scoped styles for :focus-visible ring — can't express pseudo-classes inline */}
      <style>{`
        .not-found-action {
          margin-top: 0.5rem;
          display: inline-block;
          padding: 0.56rem 1.4rem;
          border-radius: 999px;
          border: 1px solid var(--signature-cyan, #4bc5de);
          background: transparent;
          color: var(--signature-cyan, #4bc5de);
          font-family: var(--sans, system-ui, sans-serif);
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-decoration: none;
          transition: background var(--dur-1, 120ms) var(--ease, cubic-bezier(0.2,0.8,0.2,1));
        }
        .not-found-action:hover {
          background: rgba(75, 197, 222, 0.1);
        }
        .not-found-action:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--signature-cyan, #4bc5de);
        }
      `}</style>
      <LoomGlobalNav />
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '0.75rem',
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--ink-0)',
          }}
        >
          404
        </h1>
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '1rem',
            margin: 0,
            color: 'var(--fg-secondary)',
          }}
        >
          Page not found
        </p>
        <Link href="/" className="not-found-action">
          Back to home
        </Link>
      </main>
    </>
  );
}
