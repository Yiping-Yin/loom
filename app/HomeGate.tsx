'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeClient } from './HomeClient';
import { HomeProfileView } from './HomeProfileView';
import { readBeginnerProfileLocal } from '../lib/profile/profile-storage';
import { type BeginnerProfile } from '../lib/profile/beginner-profile';

/**
 * Client gate for the Home surface. First paint / SSR renders the hand-authored
 * verified dossier (`HomeClient`). After mount we check the local profile and
 * the server-known `configured` flag:
 *
 * - Profile present  → show the beginner Home (profile view).
 * - No profile + !configured → client-redirect to /onboarding (first-run path).
 * - No profile + configured  → show the owner verified dossier.
 *
 * Moving the onboarding redirect to the client (vs. a server redirect in
 * app/page.tsx) is necessary because the localStorage profile is not visible
 * to the server: a beginner who built a profile but has no content root was
 * previously redirected to /onboarding and could never reach HomeProfileView.
 *
 * The SSR / first-paint output is always HomeClient (the dossier), which keeps
 * the renderToStaticMarkup contract tests green.
 */
export function HomeGate({ configured }: { configured: boolean }) {
  const [profile, setProfile] = useState<BeginnerProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const localProfile = readBeginnerProfileLocal();
    setProfile(localProfile);
    setMounted(true);

    // Only redirect if no profile exists and the owner content root is not set.
    // This preserves first-run behavior while letting profile-only users reach
    // their beginner Home.
    if (!localProfile && !configured) {
      router.replace('/onboarding');
    }
  }, [configured, router]);

  if (mounted && profile) {
    return <HomeProfileView profile={profile} />;
  }

  return <HomeClient />;
}
