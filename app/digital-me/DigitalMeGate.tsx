'use client';

import { useEffect, useState } from 'react';
import { readBeginnerProfileLocal } from '../../lib/profile/profile-storage';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import { BeginnerDigitalMe } from './BeginnerDigitalMe';
import { IdentityEmptyState } from '../IdentityEmptyState';

/**
 * Client-side gate for Digital Me.
 *
 * F2 step 2: SSR / first paint and the no-profile STRANGER get a neutral
 * IdentityEmptyState — NOT the owner DigitalMeRoleOSClient (which now renders
 * only at /example/digital-me). Crucially, this means the owner-corpus Ask
 * widget (the bare <AskYiping /> inside DigitalMeRoleOSClient, seeded with the
 * owner corpus) no longer mounts on the default /digital-me route — it lives
 * only on the showcase. The beginner's own grounded Ask still mounts via
 * BeginnerDigitalMe once a localStorage profile is present.
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

  return (
    <IdentityEmptyState
      section="Digital Me"
      activeHref="/digital-me"
      titleId="digital-me-title"
      exampleHref="/example/digital-me"
    />
  );
}
