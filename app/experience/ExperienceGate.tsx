'use client';

import { ProfileGate } from '../profile/ProfileGate';
import { ExperienceProfileView } from './ExperienceViews';
import { IdentityEmptyState } from '../IdentityEmptyState';

/**
 * Client gate for /experience. Wraps ProfileGate (which takes a `renderProfile`
 * function prop) so the page can stay a server component and keep its
 * `export const metadata`. Views live in ./ExperienceViews so importing them
 * here never pulls page.tsx into the client graph.
 *
 * F2 step 2: SSR / first paint and the no-profile STRANGER get a neutral
 * IdentityEmptyState — NOT the owner DossierExperienceView (which now renders
 * only at /example). After mount, ProfileGate swaps to ExperienceProfileView
 * when a beginner profile is present in localStorage.
 */
export function ExperienceGate() {
  return (
    <ProfileGate renderProfile={(profile) => <ExperienceProfileView profile={profile} />}>
      <IdentityEmptyState section="Experience" activeHref="/experience" titleId="experience-title" />
    </ProfileGate>
  );
}
