'use client';

import { AboutProfileView } from './AboutProfileView';
import { ProfileGate } from '../profile/ProfileGate';
import { IdentityEmptyState } from '../IdentityEmptyState';

/**
 * Client gate for /about. Encapsulates the ProfileGate wiring (which takes a
 * `renderProfile` function prop) so the page stays a server component and can
 * keep its `export const metadata`.
 *
 * F2 step 2: SSR / first paint and the no-profile STRANGER get a neutral
 * IdentityEmptyState — NOT the owner AboutClient (which now renders only at
 * /example). After mount, ProfileGate swaps to AboutProfileView when a beginner
 * profile is present in localStorage.
 */
export function AboutGate() {
  return (
    <ProfileGate renderProfile={(profile) => <AboutProfileView profile={profile} />}>
      <IdentityEmptyState section="About" activeHref="/about" titleId="about-title" />
    </ProfileGate>
  );
}
