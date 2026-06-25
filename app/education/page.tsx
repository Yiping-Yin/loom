import { Suspense } from 'react';

import { EducationGate } from './EducationGate';

// Re-export the views so existing render tests can import them from this module.
export {
  DossierEducationView,
  EducationProfileView,
} from './EducationViews';

export const metadata = { title: 'Education · Loom' };

export default function EducationPage() {
  // EducationGate reads the `edit` search param (useSearchParams) to open the course
  // editor in-place, so it must sit under a Suspense boundary (Next 15/16).
  return (
    <Suspense fallback={<div className="edu-loading" aria-hidden />}>
      <EducationGate />
    </Suspense>
  );
}
