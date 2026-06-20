import React from 'react';
import { ExampleBanner } from '../../components/ExampleBanner';
import { HomeClient } from '../HomeClient';

export const metadata = { title: 'Example · Loom' };

/**
 * /example — showcase of a complete, hand-authored LOOM dossier.
 *
 * Purely additive (F2 step 1). Renders the owner HomeClient (the verified
 * dossier) with an ExampleBanner ribbon above it so visitors can see what a
 * finished LOOM looks like. This route never reads localStorage — it always
 * shows the owner dossier.
 *
 * The default / route is NOT touched by this file.
 */
export default function ExamplePage() {
  return (
    <>
      <ExampleBanner />
      <HomeClient />
    </>
  );
}
