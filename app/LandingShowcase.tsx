'use client';

/**
 * LandingShowcase — the "What you're weaving" section. It SHOWS a finished LOOM
 * (a fictional sample identity) so a stranger grasps the product without prose
 * and without exposing the owner's data.
 */

import { SHOWCASE_PERSONA } from '../lib/onboarding/showcase-persona';
import styles from './LandingShowcase.module.css';

const INITIALS = SHOWCASE_PERSONA.name
  .split(/\s+/)
  .map((w) => w[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

export function LandingShowcase() {
  return (
    <section className={styles.showcase} aria-label="An example LOOM">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>What you’re weaving</p>
        <h2 className={styles.heading}>A self that can speak for you.</h2>

        <div className={styles.stage}>
          <div className={styles.panel}>
            <header className={styles.identity}>
              <span className={styles.avatar} aria-hidden>
                {INITIALS}
              </span>
              <span className={styles.idText}>
                <span className={styles.name}>{SHOWCASE_PERSONA.name}</span>
                <span className={styles.role}>
                  {SHOWCASE_PERSONA.role} · {SHOWCASE_PERSONA.location}
                </span>
              </span>
              <span className={styles.chips}>
                <span className={styles.chip}>{SHOWCASE_PERSONA.sourcesCount} sources</span>
                <span className={`${styles.chip} ${styles.chipVerified}`}>
                  {SHOWCASE_PERSONA.artifactsVerified} artifacts verified
                </span>
              </span>
            </header>

            <p className={styles.summary}>{SHOWCASE_PERSONA.summary}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
