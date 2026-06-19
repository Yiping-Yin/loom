'use client';

import AboutClient from './AboutClient';
import { AboutProfileView } from './AboutProfileView';
import { ProfileGate } from '../profile/ProfileGate';

/**
 * Client gate for /about. Encapsulates the ProfileGate wiring (which takes a
 * `renderProfile` function prop) so the page stays a server component and can
 * keep its `export const metadata` — a function prop cannot cross the
 * server→client boundary, so it must be created inside a client component.
 *
 * SSR / first paint renders the owner AboutClient (preserves contract-test
 * expectations); after mount ProfileGate swaps to AboutProfileView when a
 * beginner profile is present in localStorage.
 */
export function AboutGate() {
  return (
    <ProfileGate renderProfile={(profile) => <AboutProfileView profile={profile} />}>
      <AboutClient />
    </ProfileGate>
  );
}
