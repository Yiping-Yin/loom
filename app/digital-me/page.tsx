import React from 'react';

import { DIGITAL_ME_PROOF_PATH } from '../../lib/new-loom/digital-me-role-os';
import { DigitalMeGate } from './DigitalMeGate';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  if (!DIGITAL_ME_PROOF_PATH.claims.length) {
    throw new Error('Missing Digital Me proof path claims');
  }

  // DigitalMeGate: SSR / first-paint = owner DigitalMeRoleOSClient (preserves
  // contract-test expectations); after mount swaps to BeginnerDigitalMe when a
  // beginner profile is present in localStorage.
  return <DigitalMeGate />;
}
