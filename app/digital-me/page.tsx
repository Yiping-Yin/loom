import React from 'react';

import DigitalMeRoleOSClient from './DigitalMeRoleOSClient';
import { DIGITAL_ME_PROOF_PATH } from '../../lib/new-loom/digital-me-role-os';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  if (!DIGITAL_ME_PROOF_PATH.claims.length) {
    throw new Error('Missing Digital Me proof path claims');
  }

  // DigitalMeRoleOSClient keeps #digital-me-answer-title mounted for citation links.
  return <DigitalMeRoleOSClient />;
}
