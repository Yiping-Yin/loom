'use client';

import { LoomGlobalNav } from '../components/verified-dossier/LoomGlobalNav';
import styles from './HomeLanding.module.css';

/**
 * Neutral, on-brand LOOM landing — the no-profile (STRANGER) default for `/`.
 *
 * F2 step 2: a stranger's first impression must sell LOOM, not the owner's
 * dossier. The owner dossier (HomeClient) is now reachable only at /example.
 * HomeGate renders this when no localStorage beginner profile is present, and
 * swaps to HomeProfileView once a profile exists.
 *
 * Sells the promise — turn scattered knowledge into a verifiable identity that
 * answers for you — frames the Gather → Build → Represent loop, and offers two
 * CTAs: build your own LOOM, or see a finished example.
 */
export function HomeLanding() {
  return (
    <main className={styles.page} aria-labelledby="home-landing-title">
      <div className="loom-cosmic-field" aria-hidden="true" />
      <LoomGlobalNav activeHref="/" ariaLabel="Loom navigation" />

      <div className={styles.inner}>
        <p className={styles.eyebrow}>Loom</p>
        <h1 id="home-landing-title" className={styles.headline}>
          Turn your scattered knowledge into a <em>verifiable identity</em> that
          answers for you.
        </h1>
        <ol className={styles.loop} aria-label="How Loom works">
          <li className={styles.step}>
            <span className={styles.stepName}>Gather</span>
            <span className={styles.stepHint}>Your real sources</span>
          </li>
          <li className={styles.arrow} aria-hidden="true">
            →
          </li>
          <li className={styles.step}>
            <span className={styles.stepName}>Build</span>
            <span className={styles.stepHint}>A cited dossier</span>
          </li>
          <li className={styles.arrow} aria-hidden="true">
            →
          </li>
          <li className={styles.step}>
            <span className={styles.stepName}>Represent</span>
            <span className={styles.stepHint}>It answers for you</span>
          </li>
        </ol>

        <div className={styles.ctaRow}>
          <a className={styles.ctaPrimary} href="/onboarding/profile">
            Build your LOOM →
          </a>
          <a className={styles.ctaSecondary} href="/example">
            See an example →
          </a>
        </div>
      </div>
    </main>
  );
}
