'use client';

import { useEffect, useState } from 'react';
import { HomeClient } from './HomeClient';
import { HomeProfileView } from './HomeProfileView';
import { readBeginnerProfileLocal } from '../lib/profile/profile-storage';
import { type BeginnerProfile } from '../lib/profile/beginner-profile';

/**
 * Client gate for the Home surface. First paint / SSR renders the hand-authored
 * verified dossier (`HomeClient`). After mount we read the localStorage beginner
 * profile and, if present, overlay `HomeProfileView`.
 *
 * The beginner profile is stored client-side (works in dev + web + the static
 * macOS app), so the server cannot know about it — keeping the gate on the
 * client is what makes the profile show up without a Node server.
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

  return <HomeClient />;
}
