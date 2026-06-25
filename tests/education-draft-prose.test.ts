import assert from 'node:assert/strict';
import test from 'node:test';
import { draftCourse } from '../lib/education/draft-prose';
import { type CourseRecord } from '../lib/education/course-storage';

function courseFixture(): CourseRecord {
  return {
    id: 'c1',
    schoolId: 's1',
    name: 'Mathematical Economics',
    code: 'ECON 3202',
    overview: '',
    sections: [],
    weeks: [
      { n: 1, label: 'W01', files: [{ name: 'W1 A Elements Logic.pdf', role: 'lecture' }] },
      { n: 8, label: 'W08', files: [{ name: 'W8 A Concave-Functions.pdf', role: 'lecture' }] },
    ],
    problemSets: [
      { n: 1, label: 'PS01', files: [{ name: 'Problem Set 01.pdf', role: 'assignment', boundary: 'official' }] },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

test('draftCourse fills grounded prose: overview + per-week focus/question/output + PS claim', () => {
  const drafted = draftCourse(courseFixture());

  // Overview is drafted and grounded in the real span of topics.
  assert.notEqual(drafted.overview.trim(), '');
  assert.match(drafted.overview, /Elements Logic/);
  assert.match(drafted.overview, /Concave-Functions/);
  assert.match(drafted.overview, /1 problem set\b/); // singular, count-aware

  // Each week gets a focus (the topic), a real question, and an output.
  const w1 = drafted.weeks!.find((w) => w.label === 'W01')!;
  assert.equal(w1.focus, 'Elements Logic');
  assert.match(w1.question!, /\?$/);
  assert.ok(w1.output && w1.output.length > 0);

  // The problem set gets a claim that names it.
  assert.match(drafted.problemSets![0].claim!, /PS01/);
});

test('draftCourse never clobbers prose the user already wrote (idempotent on edits)', () => {
  const course = courseFixture();
  course.overview = 'My own overview.';
  course.weeks![0].focus = 'Hand-written focus';
  const drafted = draftCourse(course);
  assert.equal(drafted.overview, 'My own overview.');
  assert.equal(drafted.weeks![0].focus, 'Hand-written focus');
  // …but still fills the empty fields.
  assert.ok(drafted.weeks![0].question);
});

test('draftCourse is safe on an empty course', () => {
  const empty: CourseRecord = {
    id: 'e', schoolId: 's', name: '', overview: '', sections: [],
    createdAt: '', updatedAt: '',
  };
  const drafted = draftCourse(empty);
  assert.equal(typeof drafted.overview, 'string');
  assert.deepEqual(drafted.weeks ?? [], []);
});
