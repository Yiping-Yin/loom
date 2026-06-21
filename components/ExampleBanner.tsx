import Link from 'next/link';
import styles from './ExampleBanner.module.css';

/**
 * Slim ribbon shown at the top of /example pages.
 *
 * Purely additive — does not appear on any existing owner route.
 * Server component: no interactivity needed.
 */
export function ExampleBanner() {
  return (
    <div className={styles.banner} role="banner" aria-label="Example LOOM showcase">
      <span className={styles.label}>
        <span className={styles.eyebrow}>Example LOOM</span>
        {' '}— this is what a finished LOOM looks like.
      </span>
      <Link href="/onboarding/profile" className={styles.cta}>
        Build yours →
      </Link>
    </div>
  );
}
