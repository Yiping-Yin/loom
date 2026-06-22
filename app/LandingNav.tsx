'use client';

/**
 * LandingNav — the lightweight top nav for the new-user product landing. NOT the
 * heavy LoomGlobalNav workspace pill (search/menu); this is calm marketing
 * chrome: the brand mark, two links to real public pages, and a Begin CTA that
 * focuses the hero input. Links point only to routes that exist.
 */

import Link from 'next/link';
import styles from './LandingNav.module.css';

export function LandingNav({
  onBegin,
  cta,
}: {
  onBegin?: () => void;
  /** Optional link CTA (e.g. on the Digital Me). Falls back to the Begin button
   *  when onBegin is given; renders no CTA when neither is provided. */
  cta?: { label: string; href: string };
}) {
  return (
    <nav className={styles.nav} aria-label="LOOM">
      <Link href="/" className={styles.brand} aria-label="LOOM home">
        <img
          className={styles.brandMoon}
          src="/loom/history/moon-orb.webp"
          alt=""
          draggable={false}
          width={24}
          height={24}
        />
        <span className={styles.wordmark}>LOOM</span>
      </Link>
      <span className={styles.links}>
        <Link href="/product-history" className={styles.link}>
          History
        </Link>
        <Link href="/example" className={styles.link}>
          Example
        </Link>
        {cta ? (
          <Link href={cta.href} className={styles.begin}>
            {cta.label}
          </Link>
        ) : onBegin ? (
          <button type="button" className={styles.begin} onClick={onBegin}>
            Begin
          </button>
        ) : null}
      </span>
    </nav>
  );
}
