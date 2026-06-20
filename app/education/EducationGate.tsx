'use client';

import { ProfileGate } from '../profile/ProfileGate';
import { EducationProfileView } from './EducationViews';
import { IdentityEmptyState } from '../IdentityEmptyState';

/**
 * Client gate for /education. Wraps ProfileGate (which takes a `renderProfile`
 * function prop) so the page can stay a server component and keep its
 * `export const metadata`. Views live in ./EducationViews so importing them here
 * never pulls page.tsx into the client graph.
 *
 * F2 step 2: SSR / first paint and the no-profile STRANGER get a neutral
 * IdentityEmptyState — NOT the owner DossierEducationView (which now renders
 * only at /example). After mount, ProfileGate swaps to EducationProfileView when
 * a beginner profile is present in localStorage.
 */
export function EducationGate() {
  return (
    <ProfileGate renderProfile={(profile) => <EducationProfileView profile={profile} />}>
      <IdentityEmptyState section="Education" activeHref="/education" titleId="education-title" />
    </ProfileGate>
  );
}
