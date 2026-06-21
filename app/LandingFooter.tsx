'use client';

/**
 * LandingFooter — a quiet, real footer that grounds the product landing (a page,
 * not a floating widget). Brand mark + copyright on the left, links to real
 * public routes on the right.
 */

import Link from 'next/link';
import styles from './LandingFooter.module.css';

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>
          <img
            className={styles.brandMoon}
            src="/brand/loom_lunar_orb.png"
            alt=""
            draggable={false}
            width={20}
            height={20}
          />
          <span className={styles.wordmark}>LOOM</span>
          <span className={styles.copy}>© 2026</span>
        </span>
        <span className={styles.links}>
          <Link href="/product-history" className={styles.link}>
            History
          </Link>
          <Link href="/example" className={styles.link}>
            Example
          </Link>
          <Link href="/help" className={styles.link}>
            Help
          </Link>
        </span>
      </div>
    </footer>
  );
}
