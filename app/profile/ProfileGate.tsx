'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { readBeginnerProfileLocal } from '../../lib/profile/profile-storage';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';

/**
 * Client-side overlay gate for the data-driven beginner profile pages.
 *
 * The profile is persisted in localStorage (works in dev + web + the shipped
 * static macOS app, which shelves `app/api`). Server / first-paint render is the
 * hand-authored dossier (`children`); after mount we read the local profile and,
 * if present, swap to the beginner profile view.
 *
 * Rendering the dossier as the pre-mount fallback keeps the page's default
 * export synchronous: `renderToStaticMarkup` of the page yields the dossier,
 * which is what the verified-dossier contract tests assert.
 */
export function ProfileGate({
  children,
  renderProfile,
}: {
  children: ReactNode;
  renderProfile: (profile: BeginnerProfile) => ReactNode;
}) {
  const [profile, setProfile] = useState<BeginnerProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProfile(readBeginnerProfileLocal());
    setMounted(true);
  }, []);

  if (mounted && profile) {
    return <>{renderProfile(profile)}</>;
  }

  return <>{children}</>;
}
