import React from 'react';
import { ExampleBanner } from '../../../components/ExampleBanner';
import DigitalMeRoleOSClient from '../../digital-me/DigitalMeRoleOSClient';
import { DIGITAL_ME_PROOF_PATH } from '../../../lib/new-loom/digital-me-role-os';

export const metadata = { title: 'Example Digital Me · Loom' };

/**
 * /example/digital-me — showcase of the owner Role-OS cited-answer surface.
 *
 * Purely additive (F2 step 1). Renders the owner DigitalMeRoleOSClient (the
 * Role-OS starred surface) with an ExampleBanner ribbon so visitors can see
 * what a finished Digital Me looks like. The embedded Ask widget keeps using
 * the owner corpus — correct for a showcase.
 *
 * This route never reads localStorage — it always shows the owner dossier.
 * The default /digital-me route is NOT touched by this file.
 */
export default function ExampleDigitalMePage() {
  if (!DIGITAL_ME_PROOF_PATH.claims.length) {
    throw new Error('Missing Digital Me proof path claims');
  }

  return (
    <>
      <ExampleBanner />
      <DigitalMeRoleOSClient />
    </>
  );
}
