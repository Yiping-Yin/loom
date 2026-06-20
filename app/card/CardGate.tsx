'use client';

import { useEffect, useState } from 'react';

import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import { readBeginnerProfileLocal } from '../../lib/profile/profile-storage';
import { decodeProfileFromHash } from '../../lib/profile/profile-share';
import { safeHref } from '../../lib/profile/safe-href';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { DigitalPostcard } from './DigitalPostcard';
import styles from './CardPage.module.css';

const ONBOARDING_HREF = '/onboarding/profile';
const EXAMPLE_HREF = '/example';
const MOON_SRC = '/brand/loom_lunar_orb.png';

type Resolved =
  | { kind: 'shared'; profile: BeginnerProfile }
  | { kind: 'own'; profile: BeginnerProfile }
  | { kind: 'empty' };

/**
 * Decide what the card should show, AFTER mount (never during render — no window
 * access at first paint).
 *
 * Priority:
 *   1. URL hash → a shared card. Decoded + normalized; owner actions hidden.
 *   2. localStorage → the owner's own card; owner actions shown.
 *   3. neither → a calm empty / CTA state.
 *
 * A profile that normalizes to an empty name+headline (a blank shared hash, or a
 * crafted empty payload) is treated as empty so a degenerate link does not show
 * a blank "Your name" card.
 */
function resolveFromEnvironment(): Resolved {
  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    const shared = decodeProfileFromHash(hash);
    if (shared && hasContent(shared)) {
      return { kind: 'shared', profile: shared };
    }
  }
  const own = readBeginnerProfileLocal();
  if (own && hasContent(own)) {
    return { kind: 'own', profile: own };
  }
  return { kind: 'empty' };
}

/** A profile has content worth showing a card for if it has at least a name. */
function hasContent(profile: BeginnerProfile): boolean {
  return Boolean(profile.home.name.trim() || profile.home.headline.trim());
}

/**
 * Client gate for /card.
 *
 * SSR / first paint renders a stable neutral shell (no window access), so the
 * static export and web build both produce a deterministic page. After mount we
 * resolve the profile source and render the postcard (or the empty CTA).
 */
export function CardGate() {
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    setResolved(resolveFromEnvironment());
  }, []);

  return (
    <>
      <LoomGlobalNav activeHref="/card" />
      <main className={styles.page} aria-label="Loom digital postcard">
        <div className="loom-cosmic-field" aria-hidden="true" />

        {resolved === null && (
          <div className={styles.skeleton} aria-hidden="true" />
        )}

        {resolved?.kind === 'shared' && (
          <DigitalPostcard profile={resolved.profile} isOwnCard={false} />
        )}

        {resolved?.kind === 'own' && (
          <DigitalPostcard profile={resolved.profile} isOwnCard />
        )}

        {resolved?.kind === 'empty' && (
          <section className={styles.empty} aria-label="No card yet">
            <img className={styles.emptyMoon} src={MOON_SRC} alt="" draggable={false} />
            <p className={styles.emptyEyebrow}>Digital postcard</p>
            <h1 className={styles.emptyTitle}>Build your Loom to get a shareable card.</h1>
            <p className={styles.emptyBody}>
              Add your name, work, and experience — Loom turns it into a compact,
              cited card you can share or download.
            </p>
            <a className={styles.emptyCta} href={safeHref(ONBOARDING_HREF) || ONBOARDING_HREF}>
              Start your Loom →
            </a>
            <p className={styles.emptySecondaryLinks}>
              <a href={safeHref(EXAMPLE_HREF) || EXAMPLE_HREF} className={styles.emptySecondaryLink}>
                See a finished example →
              </a>
              <a href="/" className={styles.emptySecondaryLink}>Home</a>
            </p>
          </section>
        )}
      </main>
    </>
  );
}
