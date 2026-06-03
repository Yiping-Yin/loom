import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  getUnswEcon3202ProblemSet,
  UNSW_ECON3202_MANUAL,
  UNSW_ECON3202_PROBLEM_SET_SLUGS,
  UNSW_ECON3202_PROBLEM_SETS,
  UNSW_ECON3202_REFERENCE_BRIDGE,
  UNSW_ECON3202_WEEKS,
} from '../lib/new-loom/unsw-shelf';

const repoRoot = path.resolve(__dirname, '..');

function readText(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('ECON3202 evidence chain keeps the weekly learning path source-backed', () => {
  assert.equal(UNSW_ECON3202_WEEKS.length, 9);
  assert.deepEqual(
    UNSW_ECON3202_WEEKS.map((week) => week.label),
    ['W01', 'W02', 'W03', 'W04', 'W05', 'W07', 'W08', 'W09', 'W10'],
  );

  for (const week of UNSW_ECON3202_WEEKS) {
    assert.ok(week.question, `${week.label} should have a study question`);
    assert.ok(week.output, `${week.label} should name a portfolio output`);
    assert.ok(week.files.length > 0, `${week.label} should include local files`);
    assert.ok(week.references.length > 0, `${week.label} should include reference anchors`);
    for (const file of week.files) {
      assert.match(file.localPath, /\/Users\/yinyiping\/Desktop\/Private Wiki\/UNSW\/ECON 3202\//);
      assert.match(file.href, /^file:\/\/\//);
    }
  }

  assert.match(UNSW_ECON3202_MANUAL.href, /^file:\/\/\//);
  assert.match(UNSW_ECON3202_MANUAL.localPath, /UNSW HTML\/ECON 3202\/COURSE\.html$/);
});

test('ECON3202 problem-set trail exposes assignments, answers, and explanation evidence', () => {
  assert.deepEqual(
    UNSW_ECON3202_PROBLEM_SETS.map((set) => set.label),
    ['PS01', 'PS02', 'PS03', 'PS04'],
  );
  assert.deepEqual(UNSW_ECON3202_PROBLEM_SET_SLUGS, ['ps01', 'ps02', 'ps03', 'ps04']);

  const ps01 = UNSW_ECON3202_PROBLEM_SETS.find((set) => set.label === 'PS01');
  const ps03 = UNSW_ECON3202_PROBLEM_SETS.find((set) => set.label === 'PS03');
  const ps04 = UNSW_ECON3202_PROBLEM_SETS.find((set) => set.label === 'PS04');

  assert.equal(getUnswEcon3202ProblemSet('ps01')?.label, 'PS01');
  assert.equal(getUnswEcon3202ProblemSet('missing'), undefined);
  assert.ok(ps01?.files.some((file) => file.label === 'Problem1-codex-explanation.pdf'));
  assert.ok(ps03?.files.some((file) => file.label === 'Problem3-codex-explanation.pdf'));
  assert.ok(ps04?.files.some((file) => file.role === 'Brief'));

  for (const set of UNSW_ECON3202_PROBLEM_SETS) {
    assert.match(set.slug, /^ps0[1-4]$/);
    assert.match(set.weight, /Problem Sets 48%/);
    assert.match(set.opened, /2026/);
    assert.match(set.due, /2026/);
    assert.ok(set.files.some((file) => ['Assignment', 'Brief'].includes(file.role)));
    assert.ok(set.files.some((file) => file.role === 'Answer'));
    assert.ok(set.claim, `${set.label} should state a portfolio evidence claim`);
    assert.ok(set.portfolioUse, `${set.label} should explain portfolio use`);
    assert.ok(set.relatedWeeks.length > 0, `${set.label} should link back to course weeks`);
    assert.ok(set.processSteps.length >= 3, `${set.label} should include process steps`);
    assert.ok(set.sourceBoundary.length >= 2, `${set.label} should define source boundaries`);
  }
});

test('ECON3202 deep page is linked from the UNSW shelf and avoids a card dashboard shape', () => {
  const shelfPage = readText('app/knowledge/unsw/page.tsx');
  const deepPage = readText('app/knowledge/unsw/econ3202/page.tsx');

  assert.match(shelfPage, /href="\/knowledge\/unsw\/econ3202"/);
  assert.match(shelfPage, /UnswDossier\.module\.css/);
  assert.match(shelfPage, /Academic work with inspectable proof\./);
  assert.match(shelfPage, /Real artifacts/);
  assert.match(shelfPage, /Source map/);
  assert.match(shelfPage, /Learning spine/);
  assert.match(shelfPage, /href=\{`\/knowledge\/unsw\/econ3202\/\$\{set\.slug\}`\}/);
  assert.match(shelfPage, /DocumentPreviewCard/);
  assert.match(deepPage, /Mathematical Economics with inspectable proof\./);
  assert.match(deepPage, /Weekly proof trail/);
  assert.match(deepPage, /Problem-set trail/);
  assert.match(deepPage, /Reference bridge/);
  assert.match(deepPage, /UNSW_ECON3202_WEEKS/);
  assert.match(deepPage, /UNSW_ECON3202_PROBLEM_SETS/);
  assert.match(deepPage, /href=\{`\/knowledge\/unsw\/econ3202\/\$\{set\.slug\}`\}/);
  assert.match(deepPage, /How does concavity connect to optimisation/);
});

test('ECON3202 reference bridge connects course weeks to durable source anchors', () => {
  assert.ok(UNSW_ECON3202_REFERENCE_BRIDGE.length >= 4);
  assert.ok(UNSW_ECON3202_REFERENCE_BRIDGE.some((item) => item.label === 'JR A1.1-A1.3.2'));
  assert.ok(UNSW_ECON3202_REFERENCE_BRIDGE.some((item) => item.label === 'Sundaram optimisation'));
  assert.ok(UNSW_ECON3202_REFERENCE_BRIDGE.every((item) => item.source && item.span && item.use));
});

test('ECON3202 problem-set detail route is static and evidence-oriented', () => {
  const detailPage = readText('app/knowledge/unsw/econ3202/[problemSet]/page.tsx');

  assert.match(detailPage, /generateStaticParams/);
  assert.match(detailPage, /UNSW_ECON3202_PROBLEM_SET_SLUGS/);
  assert.match(detailPage, /getUnswEcon3202ProblemSet/);
  assert.match(detailPage, /<UnswStudyNav active=\{set\.slug\}/);
  assert.match(detailPage, /notFound\(\)/);
  assert.match(detailPage, /Reasoning process/);
  assert.match(detailPage, /Boundary rules/);
  assert.match(detailPage, /Connected weeks/);
  assert.match(detailPage, /Portfolio use/);
  assert.doesNotMatch(detailPage, /card/i);
});

test('UNSW study pages share a course navigation rail', () => {
  const nav = readText('app/knowledge/unsw/UnswStudyNav.tsx');
  const shelfPage = readText('app/knowledge/unsw/page.tsx');
  const econPage = readText('app/knowledge/unsw/econ3202/page.tsx');
  const detailPage = readText('app/knowledge/unsw/econ3202/[problemSet]/page.tsx');

  for (const label of ['Loom', 'About', 'Sources', 'UNSW', 'ECON3202']) {
    assert.match(nav, new RegExp(label));
  }
  for (const slug of UNSW_ECON3202_PROBLEM_SET_SLUGS) {
    assert.match(nav, new RegExp(`/knowledge/unsw/econ3202/\\$\\{set\\.slug\\}`));
    assert.ok(getUnswEcon3202ProblemSet(slug), `${slug} should resolve for nav links`);
  }

  assert.match(nav, /styles\.topNav/);
  assert.match(nav, /aria-current=\{active \? 'page' : undefined\}/);
  assert.match(shelfPage, /<UnswStudyNav active="unsw" \/>/);
  assert.match(econPage, /<UnswStudyNav active="econ3202" \/>/);
  assert.match(detailPage, /<UnswStudyNav active=\{set\.slug\} \/>/);
});
