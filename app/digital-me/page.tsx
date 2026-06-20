import React from 'react';

import { DigitalMeGate } from './DigitalMeGate';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  // F2 step 2: DigitalMeGate renders a neutral IdentityEmptyState for a
  // no-profile STRANGER (the owner Role-OS surface + its owner-corpus Ask widget
  // now live only at /example/digital-me) and swaps to BeginnerDigitalMe when a
  // beginner profile is present in localStorage.
  return <DigitalMeGate />;
}
