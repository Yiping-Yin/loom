'use client';

import { useSearchParams } from 'next/navigation';
import { CourseEditor } from './CourseEditor';
import { EducationCoursesClient } from './EducationCoursesClient';
import './education.module.css';

/**
 * Client gate for /education. With `?edit=<id|new>` it opens the full-screen course
 * editor (mirroring the Studio's /studio?edit= pattern); otherwise it shows the
 * schools & courses authoring home. The read-only profile Education view still ships
 * as `EducationProfileView` (re-exported from page.tsx) for the dossier/showcase.
 */
export function EducationGate() {
  const params = useSearchParams();
  if (params.has('edit')) {
    return (
      <CourseEditor editId={params.get('edit') || 'new'} schoolId={params.get('school') ?? undefined} />
    );
  }
  return <EducationCoursesClient />;
}
