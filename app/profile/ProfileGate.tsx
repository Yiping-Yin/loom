'use client';

import { type ReactNode } from 'react';
import { OWNER_PROFILE } from '../../lib/profile/owner-profile';
import { type BeginnerProfile } from '../../lib/profile/beginner-profile';

/**
 * ONE-digital-me (owner decision, 2026-07-08): LOOM is a single-owner,
 * local-first product, so the profile pages render the owner directly.
 *
 * The old beginner layer — localStorage profile, stranger IdentityEmptyState,
 * the /me loader dance — was GTM-era product for an audience that never
 * existed here, and is retired. `renderProfile` keeps the same data-driven
 * views; they simply always receive the owner.
 */
export function ProfileGate({
  renderProfile,
}: {
  renderProfile: (profile: BeginnerProfile) => ReactNode;
}) {
  return <>{renderProfile(OWNER_PROFILE)}</>;
}
