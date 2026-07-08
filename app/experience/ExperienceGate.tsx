'use client';

import { ProfileGate } from '../profile/ProfileGate';
import { ExperienceProfileView } from './ExperienceViews';

/**
 * Client gate for /experience. Wraps ProfileGate so the page can stay a server
 * component and keep its `export const metadata`. Renders the owner directly
 * (ONE-digital-me): the stranger empty-state is retired.
 */
export function ExperienceGate() {
  return <ProfileGate renderProfile={(profile) => <ExperienceProfileView profile={profile} />} />;
}
