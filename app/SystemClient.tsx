'use client';

/**
 * SystemClient — how Loom works, on one quiet sheet.
 *
 * Replaces the retired product map. Instead of bands of legacy engine
 * names, /system now explains the one loop the product actually runs:
 *
 *   Source workspace → Reader notes → Draft references
 *
 * Sources and Draft are the two primary workspaces; everything else on
 * this page is a support surface reachable from the loop.
 */

import Link from 'next/link';

const LOOP_STEPS = [
  {
    label: 'Source workspace',
    href: '/sources',
    body: 'Add, capture, and review source material in Sources. Web captures and local files sit on the same shelf. Original files stay read-only — Loom never edits what you brought in.',
  },
  {
    label: 'Reader notes',
    href: '/sources',
    body: 'While reading, mark passages and hold questions in place. Notes stay anchored to the exact passage they came from, so every thought keeps its source.',
  },
  {
    label: 'Draft references',
    href: '/draft',
    body: 'Writing happens in Draft, with the sources you marked attached as references beside the text. Citations point back to the passage, never to a paraphrase.',
  },
] as const;

const supportLinkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  minWidth: '7.5rem',
} as const;

const supportNoteStyle = { color: 'var(--muted)', fontSize: '0.88rem' } as const;

const supportRowStyle = { display: 'flex', alignItems: 'baseline', gap: 10 } as const;

export default function SystemClient() {
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
      <article style={{ width: '100%', maxWidth: '44rem' }}>
        <header style={{ marginBottom: '2.5rem' }}>
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
            System
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            One loop, two workspaces.
          </h1>
          <p style={{ color: 'var(--fg-secondary)', lineHeight: 1.65, marginTop: '0.8rem' }}>
            Loom runs a single loop between its two primary workspaces, Sources and Draft.
            Material comes in as sources, becomes notes while you read, and leaves as
            referenced writing.
          </p>
        </header>

        <section aria-label="How material moves through Loom">
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1.1rem' }}>
            {LOOP_STEPS.map((step, index) => (
              <li
                key={step.label}
                style={{
                  border: 'var(--hairline)',
                  borderRadius: 8,
                  padding: '1rem 1.2rem',
                  background: 'color-mix(in srgb, var(--fg) 2%, var(--bg))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    marginBottom: '0.35rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '0.75rem',
                      color: 'var(--muted)',
                    }}
                  >
                    {index + 1}
                  </span>
                  <Link
                    href={step.href}
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--fg)',
                      textDecoration: 'none',
                    }}
                  >
                    {step.label}
                  </Link>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    color: 'var(--fg-secondary)',
                  }}
                >
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Support surfaces" style={{ marginTop: '2.6rem' }}>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.15rem',
              fontWeight: 600,
              marginBottom: '0.8rem',
            }}
          >
            Around the loop
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
            <li style={supportRowStyle}>
              <Link href="/discipline" style={supportLinkStyle}>
                Discipline
              </Link>
              <span style={supportNoteStyle}>the six product refusals, written down</span>
            </li>
            <li style={supportRowStyle}>
              <Link href="/year" style={supportLinkStyle}>
                The Year
              </Link>
              <span style={supportNoteStyle}>twelve months of material, weight over count</span>
            </li>
            <li style={supportRowStyle}>
              <Link href="/hour" style={supportLinkStyle}>
                The Hour
              </Link>
              <span style={supportNoteStyle}>the current thinking window, ticking</span>
            </li>
            <li style={supportRowStyle}>
              <Link href="/connections" style={supportLinkStyle}>
                Connections
              </Link>
              <span style={supportNoteStyle}>correspondents and cross-origin links</span>
            </li>
          </ul>
        </section>

        <footer style={{ marginTop: '2.6rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Nothing here speaks unless you ask. Sources hold what came in; Draft holds what
          goes out; the loop is yours to walk.
        </footer>
      </article>
    </main>
  );
}
