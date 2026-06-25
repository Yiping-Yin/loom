import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

test('Education authoring: gate, schools/courses home, and the course editor', () => {
  const gate = read('app/education/EducationGate.tsx');
  const home = read('app/education/EducationCoursesClient.tsx');
  const editor = read('app/education/CourseEditor.tsx');

  // Gate: ?edit=<id|new> opens the editor; otherwise the courses authoring home.
  assert.match(gate, /useSearchParams/);
  assert.match(gate, /<CourseEditor\b/);
  assert.match(gate, /<EducationCoursesClient\b/);

  // Home: create schools, add courses, open editor (?edit=) + the course page.
  assert.match(home, /createSchool/);
  assert.match(home, /createCourse/);
  assert.match(home, /Add school/);
  assert.match(home, /\?edit=/);
  assert.match(home, /\/education\/course\?id=/);

  // Editor: a Head (course name), an Overview, typed sections, and Done.
  assert.match(editor, /updateCourse/);
  assert.match(editor, /aria-label="Course name"/);
  assert.match(editor, /Overview/);
  assert.match(editor, /Add section/);
  assert.match(editor, /week/);
  assert.match(editor, /assessment/);
  assert.match(editor, /structure/);
  assert.match(editor, />Done<|>\s*Done\s*</);
  assert.match(editor, /\/education\/course\?id=/);

  // Auto-weave: the editor hosts the drop-files → evidence-chain build, which weaves
  // raw files into weeks/problem-sets and labels each file's source boundary.
  const build = read('app/education/CourseAutoBuild.tsx');
  assert.match(editor, /<CourseAutoBuild\b/);
  assert.match(build, /weaveCourse/);
  assert.match(build, /webkitdirectory/);
  assert.match(build, /onWeave/);
  assert.match(build, /boundary/);

  // The course page renders the woven chain as an interactive (collapsible) page.
  const view = read('app/education/course/CourseView.tsx');
  assert.match(view, /useSearchParams/);
  assert.match(view, /selectCourseById/);
  assert.match(view, /Weekly trail/);
  assert.match(view, /Problem-set trail/);
  assert.match(view, /<details/);
  assert.match(view, /boundary/);

  // Premium light theme: a scoped toggle + a warm off-white (not pure-white) override.
  const toggle = read('app/education/EduThemeToggle.tsx');
  const themeCss = read('app/education/education.module.css');
  assert.match(toggle, /eduTheme/);
  assert.match(themeCss, /\[data-edu-theme='light'\]/);
  // A warm-neutral "spacesuit" matte white — not pure #fff — with soft diffuse shadow depth.
  assert.match(themeCss, /#edeae3/i);
  assert.doesNotMatch(themeCss, /--ink-0:\s*#ffffff/i);
});
