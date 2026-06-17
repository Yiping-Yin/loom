import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import styles from './offline.module.css';

export const metadata = { title: 'Offline · Loom' };

export default function OfflinePage() {
  return (
    <>
      <LoomGlobalNav ariaLabel="Offline navigation" />
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="offline-title">
          <p className={styles.eyebrow}>Offline source</p>
          <h1 id="offline-title" className={styles.title}>This source isn&rsquo;t cached yet</h1>
          <p className={styles.copy}>
            Return to Sources and choose an available local file.
          </p>
          <div className={styles.actions}>
            {/* eslint-disable @next/next/no-html-link-for-pages */}
            <a href="/sources" className={styles.action}>Open Sources</a>
            {/* Plain anchors are intentional — this page must work without the JS router. */}
          </div>
        </section>
      </main>
    </>
  );
}
