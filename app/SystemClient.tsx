'use client';

/**
 * SystemClient — archived system note.
 *
 * The visible product story now lives in /product-history. This route stays as
 * a quiet compatibility note for old links and keeps the loop record folded
 * away unless someone explicitly opens it:
 *
 *   Source workspace → Reader notes → Draft references
 */

import Link from 'next/link';
import styles from './loom-support-page.module.css';
import { LoomSupportNav } from './LoomSupportNav';

const LOOP_STEPS = [
  {
    label: 'Source workspace',
    href: '/sources',
    body: 'Sources hold files. Original files stay read-only.',
  },
  {
    label: 'Reader notes',
    href: '/sources',
    body: 'Mark passages. Keep the anchor.',
  },
  {
    label: 'Draft references',
    href: '/draft',
    body: 'Write with references beside the text.',
  },
] as const;

export default function SystemClient() {
  return (
    <div className={styles.surface}>
      <LoomSupportNav active="/system" />
      <main className={styles.main}>
        <article className={`${styles.shellNarrow} ${styles.noteShell}`}>
          <header className={styles.noteHeader}>
            <div className={styles.eyebrow}>Archived system note</div>
            <h1 className={styles.noteTitle}>This page moved into Loom history.</h1>
            <p className={styles.noteLead}>
              Archived. The record now lives inside Loom history.
            </p>
            <div className={styles.linkRail}>
              <Link href="/product-history#system-loop">Open in Loom history</Link>
              <Link href="/loom">Back to Loom</Link>
            </div>
          </header>

          <details className={styles.archiveDetails}>
            <summary>Show archived Source / Reader notes / Draft note</summary>

            <section aria-label="How material moved through the old system note">
              <ol className={styles.orderedList}>
                {LOOP_STEPS.map((step, index) => (
                  <li key={step.label} className={styles.thinCard}>
                    <div className={styles.row}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <Link
                        href={step.href}
                        className={`${styles.textLink} ${styles.archiveStepLink}`}
                      >
                        {step.label}
                      </Link>
                    </div>
                    <p className={`${styles.muted} ${styles.archiveStepBody}`}>{step.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.archiveSupportSection} aria-label="Support surfaces">
              <h2 className={styles.sectionHeading}>Around the loop</h2>
              <ul className={styles.plainList}>
                <li className={styles.row}>
                  <Link href="/discipline" className={styles.supportLink}>
                    Discipline
                  </Link>
                  <span className={styles.supportNote}>six refusals</span>
                </li>
                <li className={styles.row}>
                  <Link href="/year" className={styles.supportLink}>
                    The Year
                  </Link>
                  <span className={styles.supportNote}>twelve months</span>
                </li>
                <li className={styles.row}>
                  <Link href="/hour" className={styles.supportLink}>
                    The Hour
                  </Link>
                  <span className={styles.supportNote}>current window</span>
                </li>
                <li className={styles.row}>
                  <Link href="/connections" className={styles.supportLink}>
                    Connections
                  </Link>
                  <span className={styles.supportNote}>source links</span>
                </li>
              </ul>
            </section>
          </details>
        </article>
      </main>
    </div>
  );
}
