import Link from 'next/link';
import { YearClient } from './YearClient';

/**
 * /year — The Year, "twelve columns, one ribbon". A support surface
 * for the annual review: twelve months of material weighed rather than
 * counted, a wintering ribbon for what cooled, and Question containers
 * for what is still open. Material flows in from Sources and settles
 * in Draft; this page only looks back at it.
 */

export const metadata = { title: 'The Year · Loom' };

export default function YearPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        padding: 'clamp(4rem, 8vh, 6rem) clamp(1.5rem, 5vw, 4rem)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '52rem' }}>
        <header style={{ marginBottom: '2.2rem' }}>
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '0.6rem',
            }}
          >
            The Year
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Twelve columns, one ribbon.
          </h1>
          <p style={{ color: 'var(--fg-secondary)', lineHeight: 1.65, marginTop: '0.8rem' }}>
            Twelve months of material, weighed rather than counted. The wintering ribbon
            shows what cooled; Question containers hold what is still open. Everything here
            arrived through <Link href="/sources" style={{ color: 'var(--accent)' }}>Sources</Link>{' '}
            and can continue in <Link href="/draft" style={{ color: 'var(--accent)' }}>Draft</Link>.
          </p>
          <nav
            aria-label="The Year related surfaces"
            style={{ display: 'flex', gap: 16, marginTop: '0.9rem', fontSize: '0.88rem' }}
          >
            <Link href="/hour" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              The Hour
            </Link>
            <Link href="/discipline" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Discipline
            </Link>
          </nav>
        </header>

        <YearClient />
      </div>
    </main>
  );
}
