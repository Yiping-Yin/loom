import React from 'react';
import { HomeClient } from '../HomeClient';

export const metadata = { title: 'You · Loom' };

/**
 * /you — the native You window's home.
 *
 * Renders the verified owner dossier (HomeClient) directly: no localStorage
 * gate, no onboarding cover, no Example ribbon. This is the dossier-retarget
 * step of the ONE-digital-me decision (owner, 2026-07-08): the You window
 * shows the owner's evidenced self instead of the legacy stranger landing.
 * The web-era / route and /example showcase are untouched.
 */
export default function YouPage() {
  return <HomeClient />;
}
