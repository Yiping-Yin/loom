import Link from 'next/link';
import styles from '../loom-support-page.module.css';
import { LoomSupportNav } from '../LoomSupportNav';

/**
 * /discipline — the six product refusals, written down as an in-app
 * document. Each refusal pairs the original Chinese commitment with
 * the English practice that enforces it in the product.
 */

export const metadata = { title: 'Discipline · Loom' };

const REFUSALS = [
  {
    refusal: '不监视你',
    practice: 'No telemetry',
    body: 'Loom records nothing about how you use it. There is no analytics pipeline, no usage beacon, no behavioral profile.',
  },
  {
    refusal: '不打断你',
    practice: 'No notifications',
    body: 'Nothing pings, badges, or interrupts. The Hour shows the present quietly; it never demands you look.',
  },
  {
    refusal: '不假装比你懂',
    practice: 'AI only appears when you ask',
    body: 'AI never speaks first, never summarizes uninvited, never rewrites your judgment. It answers when called and then steps back.',
  },
  {
    refusal: '不把你的东西拍平成 feed',
    practice: 'No home feed',
    body: 'Your material keeps its shape — sources, notes, drafts. There is no ranked stream, no engagement ordering, no infinite scroll.',
  },
  {
    refusal: '不假装一切都该被永久保存',
    practice: 'flow can fade',
    body: 'Hold what matters; flow can fade. Untouched material winters and settles into the archive instead of pretending everything is forever-urgent.',
  },
  {
    refusal: '不主动上传本地文件全文',
    practice: 'No automatic full-file upload',
    body: 'Local files are read in place. Full text leaves your machine only when you explicitly send a passage somewhere yourself.',
  },
] as const;

export default function DisciplinePage() {
  return (
    <div className={styles.surface}>
      <LoomSupportNav active="/discipline" />
      <main
        style={{
          background: 'var(--bg)',
          color: 'var(--fg)',
          padding: 'clamp(3rem, 6vh, 5rem) clamp(1.5rem, 5vw, 4rem)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <article style={{ width: '100%', maxWidth: '40rem' }}>
        <header style={{ marginBottom: '2.4rem' }}>
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
            Discipline
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            The six product refusals.
          </h1>
          <p style={{ color: 'var(--fg-secondary)', lineHeight: 1.65, marginTop: '0.8rem' }}>
            Loom is defined as much by what it refuses to do as by what it does. These six
            refusals are commitments, not settings — none of them can be toggled off.
          </p>
        </header>

        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1.1rem' }}>
          {REFUSALS.map((item, index) => (
            <li
              key={item.practice}
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
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--muted)' }}
                >
                  {index + 1}
                </span>
                <strong style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>
                  {item.refusal}
                </strong>
                <span style={{ color: 'var(--accent)', fontSize: '0.88rem' }}>
                  {item.practice}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  color: 'var(--fg-secondary)',
                }}
              >
                {item.body}
              </p>
            </li>
          ))}
        </ol>

        <footer
          style={{
            marginTop: '2.4rem',
            display: 'flex',
            gap: 16,
            color: 'var(--muted)',
            fontSize: '0.88rem',
          }}
        >
          <Link href="/system" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            How Loom works
          </Link>
          <Link href="/sources" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Back to Sources
          </Link>
        </footer>
        </article>
      </main>
    </div>
  );
}
