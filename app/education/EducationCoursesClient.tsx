'use client';

import { useEffect, useState } from 'react';
import {
  browserEducationStore,
  createCourse,
  createSchool,
  listCoursesBySchool,
  listSchools,
  removeCourseById,
  removeSchoolById,
  type CourseRecord,
  type SchoolRecord,
} from '../../lib/education/course-storage';

/**
 * The Education authoring home: create schools, add courses under them, open a
 * course in the editor (?edit=) or view its rendered page (/education/course/<id>).
 */
export function EducationCoursesClient() {
  const [mounted, setMounted] = useState(false);
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [coursesBySchool, setCoursesBySchool] = useState<Record<string, CourseRecord[]>>({});
  const [newSchool, setNewSchool] = useState('');

  const refresh = () => {
    const store = browserEducationStore();
    const list = listSchools(store);
    const map: Record<string, CourseRecord[]> = {};
    for (const s of list) map[s.id] = listCoursesBySchool(store, s.id);
    setSchools(list);
    setCoursesBySchool(map);
  };

  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  const addSchool = () => {
    const name = newSchool.trim();
    if (!name) return;
    createSchool(browserEducationStore(), name);
    setNewSchool('');
    refresh();
  };

  const addCourse = (schoolId: string) => {
    const course = createCourse(browserEducationStore(), { schoolId });
    window.location.href = `/education?edit=${course.id}`;
  };

  return (
    <main className="edu-home">
      <header className="edu-home__head">
        <p className="edu-home__eyebrow">Education</p>
        <h1 className="edu-home__title">Schools &amp; courses</h1>
      </header>

      <div className="edu-home__add-school">
        <input
          className="edu-home__school-input"
          aria-label="School name"
          placeholder="Add a school — e.g. UNSW"
          value={newSchool}
          onChange={(event) => setNewSchool(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addSchool();
          }}
        />
        <button type="button" className="edu-home__add-school-btn" onClick={addSchool}>
          Add school
        </button>
      </div>

      {!mounted ? null : schools.length === 0 ? (
        <p className="edu-home__empty">No schools yet — add one to start adding courses.</p>
      ) : (
        <div className="edu-home__schools">
          {schools.map((school) => {
            const courses = coursesBySchool[school.id] ?? [];
            return (
              <section className="edu-home__school" key={school.id} aria-label={school.name}>
                <div className="edu-home__school-head">
                  <h2 className="edu-home__school-name">{school.name}</h2>
                  <div className="edu-home__school-tools">
                    <button type="button" className="edu-home__add-course" onClick={() => addCourse(school.id)}>
                      + Course
                    </button>
                    <button
                      type="button"
                      className="edu-home__remove-school"
                      aria-label={`Remove ${school.name}`}
                      onClick={() => {
                        removeSchoolById(browserEducationStore(), school.id);
                        refresh();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {courses.length === 0 ? (
                  <p className="edu-home__school-empty">No courses yet.</p>
                ) : (
                  <ul className="edu-home__course-list">
                    {courses.map((course) => (
                      <li className="edu-home__course" key={course.id}>
                        <a className="edu-home__course-name" href={`/education/course?id=${course.id}`}>
                          {course.name}
                          {course.code ? <span className="edu-home__course-code"> · {course.code}</span> : null}
                        </a>
                        <span className="edu-home__course-tools">
                          <a className="edu-home__course-edit" href={`/education?edit=${course.id}`}>
                            Edit
                          </a>
                          <button
                            type="button"
                            className="edu-home__course-remove"
                            aria-label={`Remove ${course.name}`}
                            onClick={() => {
                              removeCourseById(browserEducationStore(), course.id);
                              refresh();
                            }}
                          >
                            Remove
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
