'use client';

import { ProfileGate } from '../profile/ProfileGate';
import { DossierExperienceView, ExperienceProfileView } from './ExperienceViews';

/**
 * Client gate for /experience. Wraps ProfileGate (which takes a `renderProfile`
 * function prop) so the page can stay a server component and keep its
 * `export const metadata` — a function prop cannot cross the server→client
 * boundary, so it must be created inside a client component. Views live in
 * ./ExperienceViews so importing them here never pulls page.tsx into the client
 * graph (which would re-taint the page as a client component).
 *
 * SSR / first paint renders the owner dossier view (preserves contract-test
 * expectations); after mount ProfileGate swaps to ExperienceProfileView when a
 * beginner profile is present in localStorage.
 */
export function ExperienceGate() {
  return (
    <ProfileGate renderProfile={(profile) => <ExperienceProfileView profile={profile} />}>
      <DossierExperienceView />
    </ProfileGate>
  );
}
