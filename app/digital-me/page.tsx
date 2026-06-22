import React, { Suspense } from 'react';

import { DigitalMeGate } from './DigitalMeGate';

export const metadata = { title: 'Digital Me · Loom' };

export default function DigitalMePage() {
  // DigitalMeGate reads the `edit` search param (useSearchParams) to render the
  // Studio editor in-place, so it must sit under a Suspense boundary (Next 15/16).
  // The gate otherwise renders IdentityEmptyState (no profile) or BeginnerDigitalMe.
  return (
    <Suspense fallback={<div className="loom-cosmic-field" aria-hidden />}>
      <DigitalMeGate />
    </Suspense>
  );
}
