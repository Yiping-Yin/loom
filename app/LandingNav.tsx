'use client';

/**
 * LandingNav — the lightweight top nav for the new-user product landing. NOT the
 * heavy LoomGlobalNav workspace pill (search/menu); this is calm marketing
 * chrome: the brand mark, two links to real public pages, and a Begin CTA that
 * focuses the hero input. Links point only to routes that exist.
 */

import Link from 'next/link';
import styles from './LandingNav.module.css';

export function LandingNav({ onBegin }: { onBegin?: () => void }) {
  return (
    <nav className={styles.nav} aria-label="LOOM">
      <span className={styles.brand}>
        <img
          className={styles.brandMoon}
          src="/brand/loom_lunar_orb.png"
          alt=""
          draggable={false}
          width={24}
          height={24}
        />
        <span className={styles.wordmark}>LOOM</span>
      </span>
      <span className={styles.links}>
        <Link href="/product-history" className={styles.link}>
          History
        </Link>
        <Link href="/example" className={styles.link}>
          Example
        </Link>
        <button type="button" className={styles.begin} onClick={onBegin}>
          Begin
        </button>
      </span>
    </nav>
  );
}
