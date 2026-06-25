'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  browserEducationStore,
  selectCourseById,
  type CourseRecord,
} from '../../../lib/education/course-storage';
import {
  type FileRole,
  type SourceBoundary,
  type WovenFile,
} from '../../../lib/education/auto-weave';
import '../education.module.css';

const ROLE_LABEL: Record<FileRole, string> = {
  lecture: 'Lecture',
  exercises: 'Exercises',
  solutions: 'Solutions',
  assignment: 'Assignment',
  answer: 'Answer',
  explanation: 'Explanation',
  material: 'Material',
};

const BOUNDARY_LABEL: Record<SourceBoundary, string> = {
  official: 'official source',
  private: 'your work',
  ai: 'AI layer',
};

function stem(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '');
}

function deriveTopic(files: WovenFile[]): string {
  const first = files.find((f) => f.role === 'lecture') ?? files[0];
  if (!first) return '';
  return stem(first.name).replace(/^W\d+\s+[A-Za-z]\s+/, '').replace(/^PS?\s*\d+\s*/i, '').trim();
}

function FileList({ files }: { files: WovenFile[] }) {
  return (
    <ul className="edu-course__files">
      {files.map((file) => (
        <li className="edu-course__file" key={file.name}>
          <span className="edu-course__file-name">{stem(file.name)}</span>
          <span className="edu-course__role" data-role={file.role}>{ROLE_LABEL[file.role]}</span>
          {file.boundary ? (
            <span className="edu-course__boundary" data-boundary={file.boundary}>
              {BOUNDARY_LABEL[file.boundary]}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function CourseView() {
  const params = useSearchParams();
  const id = params.get('id');
  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    if (!id) {
      setState('missing');
      return;
    }
    const found = selectCourseById(browserEducationStore(), id);
    if (found) {
      setCourse(found);
      setState('ready');
    } else {
      setState('missing');
    }
  }, [id]);

  if (state === 'loading') {
    return (
      <main className="edu-course">
        <p className="edu-course__empty">Opening…</p>
      </main>
    );
  }
  if (state === 'missing' || !course) {
    return (
      <main className="edu-course">
        <div className="edu-course__topbar">
          <a className="edu-course__home" href="/education">← Education</a>
        </div>
        <p className="edu-course__empty">That course could not be found.</p>
      </main>
    );
  }

  const weeks = course.weeks ?? [];
  const problemSets = course.problemSets ?? [];
  const hasChain = weeks.length > 0 || problemSets.length > 0;

  return (
    <main className="edu-course" aria-labelledby="edu-course-title">
      <div className="edu-course__topbar">
        <a className="edu-course__home" href="/education">← Education</a>
        <a className="edu-course__edit" href={`/education?edit=${course.id}`}>Edit</a>
      </div>

      <header className="edu-course__header">
        {course.code ? <p className="edu-course__code">{course.code}</p> : null}
        <h1 id="edu-course-title" className="edu-course__title">{course.name}</h1>
        {course.overview ? <p className="edu-course__overview">{course.overview}</p> : null}
      </header>

      {hasChain ? (
        <nav className="edu-course__nav" aria-label="Course sections">
          {weeks.length > 0 ? <a href="#weeks">Weekly trail <span>{weeks.length}</span></a> : null}
          {problemSets.length > 0 ? <a href="#problem-sets">Problem sets <span>{problemSets.length}</span></a> : null}
        </nav>
      ) : null}

      {weeks.length > 0 ? (
        <section id="weeks" className="edu-course__section" aria-label="Weekly trail">
          <h2 className="edu-course__section-title">Weekly trail</h2>
          <div className="edu-course__items">
            {weeks.map((week, index) => (
              <details className="edu-course__item" key={week.label} open={index === 0}>
                <summary className="edu-course__summary">
                  <span className="edu-course__marker">{week.label}</span>
                  <span className="edu-course__topic">{deriveTopic(week.files)}</span>
                  <span className="edu-course__count">{week.files.length} file{week.files.length === 1 ? '' : 's'}</span>
                </summary>
                <FileList files={week.files} />
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {problemSets.length > 0 ? (
        <section id="problem-sets" className="edu-course__section" aria-label="Problem-set trail">
          <h2 className="edu-course__section-title">Problem-set trail</h2>
          <div className="edu-course__items">
            {problemSets.map((set) => (
              <details className="edu-course__item" key={set.label}>
                <summary className="edu-course__summary">
                  <span className="edu-course__marker">{set.label}</span>
                  <span className="edu-course__topic">{deriveTopic(set.files)}</span>
                  <span className="edu-course__count">{set.files.length} file{set.files.length === 1 ? '' : 's'}</span>
                </summary>
                <FileList files={set.files} />
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {!hasChain ? (
        <p className="edu-course__empty">
          No materials yet. <a href={`/education?edit=${course.id}`}>Add files</a> to build the course.
        </p>
      ) : null}
    </main>
  );
}
