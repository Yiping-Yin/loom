'use client';

import { useEffect, useState } from 'react';

import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import { OWNER_PROFILE } from '../../lib/profile/owner-profile';
import { decodeProfileFromHash } from '../../lib/profile/profile-share';
import { LoomGlobalNav } from '../../components/verified-dossier/LoomGlobalNav';
import { DigitalPostcard } from './DigitalPostcard';
import styles from './CardPage.module.css';

type Resolved =
  | { kind: 'shared'; profile: BeginnerProfile }
  | { kind: 'own'; profile: BeginnerProfile };

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
  // ONE-digital-me: the owner IS the default card; the beginner localStorage
  // layer and its empty-CTA state are retired.
  return { kind: 'own', profile: OWNER_PROFILE };
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
      </main>
    </>
  );
}
