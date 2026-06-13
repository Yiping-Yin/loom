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
        className={styles.main}
        style={{ padding: 'var(--support-main-padding)' }}
      >
        <article className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>Discipline</div>
            <h1 className={styles.title}>The six product refusals.</h1>
            <p className={styles.lead}>
              Loom is defined as much by what it refuses to do as by what it does. These six
              refusals are commitments, not settings — none of them can be toggled off.
            </p>
          </div>
          <div className={styles.heroPanel} aria-hidden="true">
            <div className={styles.instrument}>
              <div className={styles.instrumentKicker}>Negative space</div>
              <div className={styles.instrumentValue}>06</div>
              <div className={styles.instrumentMeta}>
                No telemetry, no interruptions, no feed, no unsolicited AI, no false urgency,
                no automatic full-file upload.
              </div>
            </div>
          </div>
        </header>

        <ol className={styles.sectionGrid} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {REFUSALS.map((item, index) => (
            <li
              key={item.practice}
              className={styles.thinCard}
            >
              <div className={styles.row} style={{ marginBottom: '0.35rem' }}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <strong style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>
                  {item.refusal}
                </strong>
                <span className={styles.supportNote}>
                  {item.practice}
                </span>
              </div>
              <p className={styles.muted} style={{ margin: 0 }}>{item.body}</p>
            </li>
          ))}
        </ol>

        <footer className={styles.linkRail}>
          <Link href="/system">How Loom works</Link>
          <Link href="/sources">Back to Sources</Link>
        </footer>
        </article>
      </main>
    </div>
  );
}
