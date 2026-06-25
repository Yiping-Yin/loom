import { Suspense } from 'react';

import { CourseView } from './CourseView';

export const metadata = { title: 'Course · Loom' };

export default function CoursePage() {
  // CourseView reads the `id` search param (useSearchParams) to load the course from
  // local storage, so it must sit under a Suspense boundary (Next 15/16).
  return (
    <Suspense fallback={<div className="edu-loading" aria-hidden />}>
      <CourseView />
    </Suspense>
  );
}
