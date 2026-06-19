'use client';

import { ProfileGate } from '../profile/ProfileGate';
import { DossierEducationView, EducationProfileView } from './EducationViews';

/**
 * Client gate for /education. Wraps ProfileGate (which takes a `renderProfile`
 * function prop) so the page can stay a server component and keep its
 * `export const metadata` — a function prop cannot cross the server→client
 * boundary, so it must be created inside a client component. Views live in
 * ./EducationViews so importing them here never pulls page.tsx into the client
 * graph (which would re-taint the page as a client component).
 *
 * SSR / first paint renders the owner dossier view (preserves contract-test
 * expectations); after mount ProfileGate swaps to EducationProfileView when a
 * beginner profile is present in localStorage.
 */
export function EducationGate() {
  return (
    <ProfileGate renderProfile={(profile) => <EducationProfileView profile={profile} />}>
      <DossierEducationView />
    </ProfileGate>
  );
}
