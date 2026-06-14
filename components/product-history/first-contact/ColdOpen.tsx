'use client';

/**
 * ColdOpen — the cinematic "History" cold open over the hero.
 *
 * On the first visit of a browser session, the word "History" fades in over
 * the cool-black hero, flickers a few low-contrast times like a visor display
 * powering on, then fades out to reveal the scene. It plays AT MOST once per
 * session (sessionStorage), is skipped entirely on reduced motion, and never
 * renders on the server / first paint (so there is no hydration flash and the
 * static export ships the clean arrived frame).
 *
 * Flash safety: the flicker only dips opacity (never a full black↔white
 * strobe), stays under three general flashes, and is low frequency — within
 * WCAG 2.3.1 guidance.
 */
import { useEffect, useState } from 'react';
import styles from './FirstContact.module.css';
import { COLD_OPEN_DURATION_MS, COLD_OPEN_KEY } from './constants';

type Phase = 'idle' | 'playing' | 'done';

export function ColdOpen() {
  // Starts 'idle' on both server and first client render → identical markup,
  // no hydration mismatch. The effect decides whether to play.
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(COLD_OPEN_KEY) === '1';
    } catch {
      // Private mode / blocked storage → treat as not played; it just won't
      // persist across reloads, which is acceptable.
    }

    if (prefersReduced || alreadyPlayed) {
      setPhase('done');
      return;
    }

    try {
      sessionStorage.setItem(COLD_OPEN_KEY, '1');
    } catch {
      /* ignore */
    }

    setPhase('playing');
    const timer = window.setTimeout(() => setPhase('done'), COLD_OPEN_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (phase !== 'playing') return null;

  return (
    <div className={styles.coldOpen} aria-hidden="true">
      {/* Only the word "History" at the cold open — no tag/label. */}
      <span className={styles.coldOpenWord}>History</span>
    </div>
  );
}

export default ColdOpen;
