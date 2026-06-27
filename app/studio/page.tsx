import { Suspense } from 'react';
import { StudioGate } from './StudioGate';

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="loom-cosmic-field" aria-hidden />}>
      <StudioGate />
    </Suspense>
  );
}
