import Link from 'next/link';
import { YearClient } from './YearClient';
import styles from '../loom-support-page.module.css';
import { LoomSupportNav } from '../LoomSupportNav';

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
    <div className={styles.surface}>
      <LoomSupportNav active="/year" />
      <main className={styles.main}>
        <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>The Year</div>
            <h1 className={styles.title}>Twelve columns, one ribbon.</h1>
            <p className={styles.lead}>
              Twelve months of material, weighed rather than counted. The wintering ribbon
              shows what cooled; Question containers hold what is still open. Everything here
              arrived through <Link href="/sources" className={styles.textLink}>Sources</Link>{' '}
              and can continue in <Link href="/draft" className={styles.textLink}>Draft</Link>.
            </p>
            <nav aria-label="The Year related surfaces" className={styles.linkRail}>
              <Link href="/hour">The Hour</Link>
              <Link href="/discipline">Discipline</Link>
            </nav>
          </div>
          <div className={styles.heroPanel} aria-hidden="true">
            <div className={styles.instrument}>
              <div className={styles.instrumentKicker}>Annual material</div>
              <div className={styles.instrumentValue}>12</div>
              <div className={styles.instrumentMeta}>
                Months are weighted by material and attention, then cooled into active,
                wintering, or archived bands.
              </div>
            </div>
          </div>
        </header>

          <YearClient />
        </div>
      </main>
    </div>
  );
}
