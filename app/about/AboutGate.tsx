'use client';

import { AboutProfileView } from './AboutProfileView';
import { ProfileGate } from '../profile/ProfileGate';

/**
 * Client gate for /about. Encapsulates the ProfileGate wiring (which takes a
 * `renderProfile` function prop) so the page stays a server component and can
 * keep its `export const metadata`. Renders the owner directly
 * (ONE-digital-me): the stranger empty-state is retired.
 */
export function AboutGate() {
  return <ProfileGate renderProfile={(profile) => <AboutProfileView profile={profile} />} />;
}
