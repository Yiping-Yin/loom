'use client';

import { useEffect, useState } from 'react';
import { readBeginnerProfileLocal } from '../../lib/profile/profile-storage';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import { BeginnerDigitalMe } from './BeginnerDigitalMe';
import DigitalMeRoleOSClient from './DigitalMeRoleOSClient';

/**
 * Client-side gate for Digital Me.
 *
 * Mirrors ProfileGate (app/profile/ProfileGate.tsx): SSR / first-paint renders
 * the owner DigitalMeRoleOSClient; after mount we read localStorage and, if a
 * beginner profile is present, swap to BeginnerDigitalMe.
 *
 * Rendering the owner view as the pre-mount fallback means renderToStaticMarkup
 * of the page yields the owner dossier — exactly what the verified-dossier
 * contract tests assert.
 */
export function DigitalMeGate() {
  const [profile, setProfile] = useState<BeginnerProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(readBeginnerProfileLocal());
    setMounted(true);
  }, []);

  if (mounted && profile) {
    return <BeginnerDigitalMe profile={profile} />;
  }

  return <DigitalMeRoleOSClient />;
}
