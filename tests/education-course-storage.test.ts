import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSchool,
  listSchools,
  createCourse,
  listCoursesBySchool,
  selectCourseById,
  updateCourse,
  removeCourseById,
  removeSchoolById,
  type EducationStore,
} from '../lib/education/course-storage';

function memStore(): EducationStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } };
}

test('schools + courses: create, list, scope-by-school, select, update, remove', () => {
  const s = memStore();

  const unsw = createSchool(s, 'UNSW');
  assert.equal(listSchools(s).length, 1);
  assert.equal(listSchools(s)[0].name, 'UNSW');

  const course = createCourse(s, { schoolId: unsw.id, name: 'Microeconomics', code: 'ECON 3202' });
  assert.equal(course.schoolId, unsw.id);
  assert.equal(listCoursesBySchool(s, unsw.id).length, 1);
  assert.equal(selectCourseById(s, course.id)?.name, 'Microeconomics');
  assert.equal(selectCourseById(s, course.id)?.code, 'ECON 3202');

  // The rich document: an overview + a body of typed sections (Week / Assessment).
  updateCourse(s, course.id, {
    overview: 'Intermediate microeconomics.',
    sections: [
      { id: 'w1', kind: 'week', title: 'Week 1', body: '# Supply & demand' },
      { id: 'a1', kind: 'assessment', title: 'Assessment', body: 'Final exam 60%' },
    ],
  });
  const got = selectCourseById(s, course.id);
  assert.equal(got?.overview, 'Intermediate microeconomics.');
  assert.equal(got?.sections.length, 2);
  assert.equal(got?.sections[0].kind, 'week');

  removeCourseById(s, course.id);
  assert.equal(listCoursesBySchool(s, unsw.id).length, 0);

  // Removing a school cascades to its courses.
  const macro = createCourse(s, { schoolId: unsw.id, name: 'Macro' });
  removeSchoolById(s, unsw.id);
  assert.equal(listSchools(s).length, 0);
  assert.equal(selectCourseById(s, macro.id), null);
});

test('SSR-safe: a null store reads empty and never throws on write', () => {
  assert.deepEqual(listSchools(null), []);
  assert.deepEqual(listCoursesBySchool(null, 'x'), []);
  assert.equal(selectCourseById(null, 'x'), null);
  const c = createCourse(null, { schoolId: 'x', name: 'Y' });
  assert.equal(c.name, 'Y');
});
