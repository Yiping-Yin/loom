'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  browserEducationStore,
  createCourse,
  selectCourseById,
  updateCourse,
  type CourseRecord,
  type CourseSection,
  type CourseSectionKind,
} from '../../lib/education/course-storage';
import { type WovenProblemSet, type WovenWeek } from '../../lib/education/auto-weave';
import { CourseAutoBuild } from './CourseAutoBuild';
import { EduThemeToggle } from './EduThemeToggle';

const SECTION_KINDS: { kind: CourseSectionKind; label: string }[] = [
  { kind: 'week', label: 'Week' },
  { kind: 'assessment', label: 'Assessment' },
  { kind: 'structure', label: 'Course Structure' },
  { kind: 'custom', label: 'Custom' },
];

function sectionId(): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `sec_${rand}`;
}

/**
 * The course document editor: a Head (course name + code), an Overview, and a body
 * of typed sections (Week / Assessment / Course Structure / Custom). Auto-saves to
 * local storage; "Done" opens the rendered, interactive course page.
 */
export function CourseEditor({ editId, schoolId }: { editId: string; schoolId?: string }) {
  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const store = browserEducationStore();
    if (editId && editId !== 'new') {
      const existing = selectCourseById(store, editId);
      if (existing) setCourse(existing);
      else setMissing(true);
      return;
    }
    const created = createCourse(store, { schoolId: schoolId ?? 'unassigned' });
    setCourse(created);
    // Keep the created course on reload by pinning its id into the URL.
    try {
      window.history.replaceState(null, '', `/education?edit=${created.id}`);
    } catch {
      /* no-op */
    }
  }, [editId, schoolId]);

  const scheduleSave = (next: CourseRecord) => {
    setCourse(next);
    setSaved(false);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      updateCourse(browserEducationStore(), next.id, {
        name: next.name,
        code: next.code,
        overview: next.overview,
        sections: next.sections,
        weeks: next.weeks,
        problemSets: next.problemSets,
      });
      setSaved(true);
    }, 400);
  };

  const coursePath = useMemo(() => (course ? `/education/course?id=${course.id}` : '/education'), [course]);

  if (missing) {
    return (
      <main className="edu-editor">
        <div className="edu-editor__topbar">
          <a className="edu-editor__home" href="/education">← Education</a>
        </div>
        <p className="edu-editor__empty">That course could not be found.</p>
      </main>
    );
  }
  if (!course) {
    return (
      <main className="edu-editor">
        <div className="edu-editor__topbar">
          <a className="edu-editor__home" href="/education">← Education</a>
        </div>
        <p className="edu-editor__empty">Opening…</p>
      </main>
    );
  }

  const patch = (p: Partial<CourseRecord>) => scheduleSave({ ...course, ...p });
  const addSection = (kind: CourseSectionKind, label: string) => {
    const count = course.sections.filter((s) => s.kind === kind).length;
    const title = kind === 'week' ? `Week ${count + 1}` : count > 0 ? `${label} ${count + 1}` : label;
    patch({ sections: [...course.sections, { id: sectionId(), kind, title, body: '' }] });
  };
  const updateSection = (id: string, p: Partial<CourseSection>) =>
    patch({ sections: course.sections.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const removeSection = (id: string) => patch({ sections: course.sections.filter((s) => s.id !== id) });
  const moveSection = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= course.sections.length) return;
    const next = course.sections.slice();
    [next[index], next[j]] = [next[j], next[index]];
    patch({ sections: next });
  };

  return (
    <main className="edu-editor">
      <div className="edu-editor__topbar">
        <a className="edu-editor__home" href="/education">← Education</a>
        <div className="edu-editor__topbar-right">
          <EduThemeToggle />
          <span className="edu-editor__save">{saved ? 'Saved' : 'Saving…'}</span>
          <a className="edu-editor__done" href={coursePath}>Done</a>
        </div>
      </div>

      <input
        className="edu-editor__name"
        aria-label="Course name"
        placeholder="Course name"
        value={course.name === 'Untitled course' ? '' : course.name}
        onChange={(event) => patch({ name: event.target.value || 'Untitled course' })}
      />
      <input
        className="edu-editor__code"
        aria-label="Course code"
        placeholder="Course code — optional"
        value={course.code ?? ''}
        onChange={(event) => patch({ code: event.target.value })}
      />

      <section className="edu-editor__block">
        <label className="edu-editor__label">Overview</label>
        <textarea
          className="edu-editor__textarea"
          aria-label="Overview"
          placeholder="What is this course about?"
          value={course.overview}
          onChange={(event) => patch({ overview: event.target.value })}
        />
      </section>

      <CourseAutoBuild
        weeks={course.weeks ?? []}
        problemSets={course.problemSets ?? []}
        onWeave={(weeks: WovenWeek[], problemSets: WovenProblemSet[]) => patch({ weeks, problemSets })}
      />

      <div className="edu-editor__sections">
        {course.sections.map((section, index) => (
          <article className="edu-editor__section" key={section.id}>
            <div className="edu-editor__section-head">
              <input
                className="edu-editor__section-title"
                aria-label="Section title"
                value={section.title}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
              />
              <div className="edu-editor__section-tools">
                <button type="button" aria-label="Move section up" onClick={() => moveSection(index, -1)}>↑</button>
                <button type="button" aria-label="Move section down" onClick={() => moveSection(index, 1)}>↓</button>
                <button type="button" aria-label="Remove section" onClick={() => removeSection(section.id)}>✕</button>
              </div>
            </div>
            <textarea
              className="edu-editor__textarea"
              aria-label={`${section.title} content`}
              placeholder="Write in Markdown — headings, lists, code, math…"
              value={section.body}
              onChange={(event) => updateSection(section.id, { body: event.target.value })}
            />
          </article>
        ))}
      </div>

      <div className="edu-editor__add">
        <span className="edu-editor__add-label">Add section</span>
        {SECTION_KINDS.map((k) => (
          <button type="button" key={k.kind} onClick={() => addSection(k.kind, k.label)}>
            + {k.label}
          </button>
        ))}
      </div>
    </main>
  );
}
