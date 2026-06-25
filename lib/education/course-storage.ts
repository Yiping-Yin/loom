/**
 * Local-first storage for the Education authoring feature: schools group courses,
 * and each course is a rich document (a course name + an overview + a body of typed
 * sections). Mirrors the Studio draft-storage convention — two plain localStorage
 * collections behind a small adapter, SSR-safe, never throws.
 */

export type CourseSectionKind = 'overview' | 'week' | 'assessment' | 'structure' | 'custom';

/** One labelled region of the course body (e.g. "Week 1", "Assessment"). Markdown body. */
export type CourseSection = {
  id: string;
  kind: CourseSectionKind;
  title: string;
  body: string;
};

export type CourseRecord = {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  overview: string;
  sections: CourseSection[];
  createdAt: string;
  updatedAt: string;
};

export type SchoolRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

/** Minimal synchronous key/value store (window.localStorage satisfies this). */
export type EducationStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export const EDUCATION_SCHOOLS_KEY = 'loom.education.schools.v1';
export const EDUCATION_COURSES_KEY = 'loom.education.courses.v1';

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${rand}`;
}

function readList<T>(store: EducationStore | null, key: string): T[] {
  if (!store) return [];
  try {
    const raw = store.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(store: EducationStore | null, key: string, list: T[]): void {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(list));
  } catch {
    /* storage unavailable — local-first stays best-effort */
  }
}

/* ---- Schools ---------------------------------------------------------------- */

export function listSchools(store: EducationStore | null): SchoolRecord[] {
  return readList<SchoolRecord>(store, EDUCATION_SCHOOLS_KEY)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createSchool(store: EducationStore | null, name: string): SchoolRecord {
  const ts = nowIso();
  const school: SchoolRecord = {
    id: uid('sch'),
    name: name.trim() || 'Untitled school',
    createdAt: ts,
    updatedAt: ts,
  };
  writeList(store, EDUCATION_SCHOOLS_KEY, [...readList<SchoolRecord>(store, EDUCATION_SCHOOLS_KEY), school]);
  return school;
}

export function removeSchoolById(store: EducationStore | null, id: string): void {
  writeList(
    store,
    EDUCATION_SCHOOLS_KEY,
    readList<SchoolRecord>(store, EDUCATION_SCHOOLS_KEY).filter((s) => s.id !== id),
  );
  // A school owns its courses — cascade the delete.
  writeList(
    store,
    EDUCATION_COURSES_KEY,
    readList<CourseRecord>(store, EDUCATION_COURSES_KEY).filter((c) => c.schoolId !== id),
  );
}

/* ---- Courses ---------------------------------------------------------------- */

export function listCourses(store: EducationStore | null): CourseRecord[] {
  return readList<CourseRecord>(store, EDUCATION_COURSES_KEY)
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function listCoursesBySchool(store: EducationStore | null, schoolId: string): CourseRecord[] {
  return listCourses(store).filter((c) => c.schoolId === schoolId);
}

export function selectCourseById(store: EducationStore | null, id: string): CourseRecord | null {
  return readList<CourseRecord>(store, EDUCATION_COURSES_KEY).find((c) => c.id === id) ?? null;
}

export function createCourse(
  store: EducationStore | null,
  input: { schoolId: string; name?: string; code?: string },
): CourseRecord {
  const ts = nowIso();
  const course: CourseRecord = {
    id: uid('crs'),
    schoolId: input.schoolId,
    name: input.name?.trim() || 'Untitled course',
    code: input.code?.trim() || undefined,
    overview: '',
    sections: [],
    createdAt: ts,
    updatedAt: ts,
  };
  writeList(store, EDUCATION_COURSES_KEY, [...readList<CourseRecord>(store, EDUCATION_COURSES_KEY), course]);
  return course;
}

export function updateCourse(
  store: EducationStore | null,
  id: string,
  patch: Partial<Omit<CourseRecord, 'id' | 'schoolId' | 'createdAt'>>,
): CourseRecord | null {
  let updated: CourseRecord | null = null;
  const next = readList<CourseRecord>(store, EDUCATION_COURSES_KEY).map((c) => {
    if (c.id !== id) return c;
    updated = { ...c, ...patch, updatedAt: nowIso() };
    return updated;
  });
  if (updated) writeList(store, EDUCATION_COURSES_KEY, next);
  return updated;
}

export function removeCourseById(store: EducationStore | null, id: string): void {
  writeList(
    store,
    EDUCATION_COURSES_KEY,
    readList<CourseRecord>(store, EDUCATION_COURSES_KEY).filter((c) => c.id !== id),
  );
}

/** The browser localStorage adapter (null during SSR / when storage is blocked). */
export function browserEducationStore(): EducationStore | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
