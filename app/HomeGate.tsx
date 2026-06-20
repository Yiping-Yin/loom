'use client';

import { useEffect, useState } from 'react';
import { HomeLanding } from './HomeLanding';
import { HomeProfileView } from './HomeProfileView';
import { readBeginnerProfileLocal } from '../lib/profile/profile-storage';
import { type BeginnerProfile } from '../lib/profile/beginner-profile';

/**
 * Client gate for the Home surface (F2 step 2: generic product default).
 *
 * - No profile (STRANGER) → the neutral on-brand HomeLanding. A stranger's
 *   first impression sells Loom, not the owner's dossier (which now lives only
 *   at /example). The landing's two CTAs (Build your LOOM / See an example)
 *   replace the old dead-end that redirected to /onboarding, so there is no
 *   longer a content-root redirect here.
 * - Profile present → the beginner HomeProfileView.
 *
 * SSR / first paint renders HomeLanding (the no-profile default); after mount we
 * read the localStorage profile — invisible to the server — and swap to
 * HomeProfileView when one is present.
 */
export function HomeGate() {
  const [profile, setProfile] = useState<BeginnerProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(readBeginnerProfileLocal());
    setMounted(true);
  }, []);

  if (mounted && profile) {
    return <HomeProfileView profile={profile} />;
  }

  return <HomeLanding />;
}
