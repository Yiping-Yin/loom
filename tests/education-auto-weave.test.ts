import assert from 'node:assert/strict';
import test from 'node:test';
import { weaveCourse, type RawFile } from '../lib/education/auto-weave';

const f = (path: string): RawFile => ({ name: path.split('/').pop() as string, path });

test('auto-weave reconstructs weeks + problem sets + file roles from raw course files', () => {
  // The real ECON3202 raw materials a beginner would drop in.
  const files = [
    f('02_Week/W01/W1 A Elements Logic.pdf'),
    f('02_Week/W01/W1 D Suggested Exercises.pdf'),
    f('02_Week/W01/W1 E Suggested Solutions.pdf'),
    f('02_Week/W02/W2 A Convex Sets.pdf'),
    f('02_Week/W10/W10 A Lagrange.pdf'),
    f('03_Problem_Set/Problem Set 01.pdf'),
    f('03_Problem_Set/Problem1.pdf'),
    f('03_Problem_Set/Problem1-codex-explanation.pdf'),
    f('03_Problem_Set/Problem Set 02.pdf'),
    f('03_Problem_Set/Problem2.pdf'),
  ];

  const woven = weaveCourse(files);

  // Weeks are grouped and ordered.
  assert.deepEqual(woven.weeks.map((w) => w.label), ['W01', 'W02', 'W10']);
  const w1 = woven.weeks[0];
  assert.equal(w1.files.length, 3);
  assert.equal(w1.files.find((x) => x.name.includes('Elements Logic'))?.role, 'lecture');
  assert.equal(w1.files.find((x) => x.name.includes('Exercises'))?.role, 'exercises');
  assert.equal(w1.files.find((x) => x.name.includes('Solutions'))?.role, 'solutions');

  // Problem sets grouped + roled, with the source boundary auto-labelled.
  assert.deepEqual(woven.problemSets.map((p) => p.label), ['PS01', 'PS02']);
  const ps1 = woven.problemSets[0];
  assert.equal(ps1.files.length, 3);
  assert.equal(ps1.files.find((x) => x.name === 'Problem Set 01.pdf')?.role, 'assignment');
  assert.equal(ps1.files.find((x) => x.name === 'Problem1.pdf')?.role, 'answer');
  assert.equal(ps1.files.find((x) => x.name.includes('codex'))?.role, 'explanation');
  // Provenance hygiene, for free: official source vs private answer vs AI layer.
  assert.equal(ps1.files.find((x) => x.role === 'assignment')?.boundary, 'official');
  assert.equal(ps1.files.find((x) => x.role === 'answer')?.boundary, 'private');
  assert.equal(ps1.files.find((x) => x.role === 'explanation')?.boundary, 'ai');

  assert.equal(woven.loose.length, 0);
});

test('auto-weave is robust to loose / unrecognised files', () => {
  const woven = weaveCourse([
    { name: 'syllabus.pdf' },
    { name: 'random-notes.txt' },
    { name: 'W3 B Continuity.pdf', path: '02_Week/W03/W3 B Continuity.pdf' },
  ]);
  assert.equal(woven.weeks.length, 1);
  assert.equal(woven.weeks[0].label, 'W03');
  assert.equal(woven.loose.length, 2);
});
