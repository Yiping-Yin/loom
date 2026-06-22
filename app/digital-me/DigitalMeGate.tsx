'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { readBeginnerProfileLocal } from '../../lib/profile/profile-storage';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';
import { BeginnerDigitalMe } from './BeginnerDigitalMe';
import { IdentityEmptyState } from '../IdentityEmptyState';
import { DraftClient } from '../draft/DraftClient';

/**
 * Client-side gate for Digital Me.
 *
 * F2 step 2: the no-profile STRANGER gets a neutral IdentityEmptyState — NOT the
 * owner DigitalMeRoleOSClient (which now renders only at /example/digital-me).
 * Crucially, this means the owner-corpus Ask widget (the bare <AskYiping />
 * inside DigitalMeRoleOSClient, seeded with the owner corpus) no longer mounts
 * on the default /digital-me route — it lives only on the showcase. The
 * beginner's own grounded Ask still mounts via BeginnerDigitalMe once a
 * localStorage profile is present.
 *
 * CE-T5 (clean returning door): returning users are now routed straight here, so
 * the FIRST paint must NOT flash the stranger IdentityEmptyState. Before mount we
 * render a neutral cosmic skeleton; only AFTER mount, when there is genuinely no
 * profile, do we fall through to the stranger empty state. A returning user with
 * a profile lands directly in their usable LOOM.
 */
export function DigitalMeGate() {
  const [profile, setProfile] = useState<BeginnerProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setProfile(readBeginnerProfileLocal());
    setMounted(true);
  }, []);

  // Edit mode: /digital-me?edit=<id|new> renders the Studio editor full-screen
  // (no cosmic field, no nav) — mutually exclusive with the identity view. The
  // Studio editor IS Digital Me here; there is no separate /draft surface.
  if (searchParams.has('edit')) {
    return (
      <DraftClient
        editId={searchParams.get('edit') || 'new'}
        initialDraftTypeId={searchParams.get('draftType') ?? undefined}
      />
    );
  }

  // Pre-mount: localStorage is unreadable (SSR / first paint). Show a neutral
  // cosmic field rather than guessing stranger-vs-returning — never flash the
  // stranger empty state at a returning user.
  if (!mounted) {
    return <div className="loom-cosmic-field" aria-hidden />;
  }

  if (profile) {
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
