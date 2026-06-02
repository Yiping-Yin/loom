import assert from 'node:assert/strict';
import test from 'node:test';

import {
  VERIFIED_DOSSIER_AI_PROMPT,
  VERIFIED_DOSSIER_ARTIFACTS,
  VERIFIED_DOSSIER_HISTORY,
  VERIFIED_DOSSIER_HOME_COPY,
  VERIFIED_DOSSIER_PROFILE,
  VERIFIED_DOSSIER_SECTIONS,
  VERIFIED_DOSSIER_TOP_NAV,
} from '../lib/new-loom/verified-dossier-home';

test('verified dossier home data preserves approved product definition', () => {
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.headline,
    'A knowledge profile people can inspect and ask.',
  );
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.body,
    /Sources, drafts, projects, and conversations become a public record/i,
  );
  assert.match(
    VERIFIED_DOSSIER_HOME_COPY.chineseBody,
    /资料、学习路径、作品、过程记录和 AI 对话/,
  );
});

test('verified dossier home keeps canonical navigation and profile identity', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_TOP_NAV.map((item) => item.label),
    ['About', 'Sources', 'UNSW', 'Quantnet', 'WQU', 'Claude', 'History'],
  );
  assert.equal(VERIFIED_DOSSIER_PROFILE.name, 'Yiping Yin');
  assert.match(VERIFIED_DOSSIER_PROFILE.location, /Sydney/);
  assert.ok(VERIFIED_DOSSIER_PROFILE.links.some((link) => link.label === 'LinkedIn'));
  assert.ok(VERIFIED_DOSSIER_PROFILE.memberships.some((item) => item.label === 'UNSW Sydney'));
});

test('verified dossier home includes ECON3202 artifacts and file kinds', () => {
  const labels = VERIFIED_DOSSIER_ARTIFACTS.map((artifact) => artifact.label);
  for (const label of [
    'ECON3202 Problem Set 2.pdf',
    'Lecture 8 Slides.pptx',
    'Tutorial 3 Solutions.pdf',
    'Lecture 8 Notes.pdf',
    'About me page.docx',
    'BHP Case Study.xlsx',
    'Prompt library.md',
  ]) {
    assert.ok(labels.includes(label), `${label} should be present`);
  }

  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'pdf'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'ppt'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'word'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'excel'));
  assert.ok(VERIFIED_DOSSIER_ARTIFACTS.some((artifact) => artifact.kind === 'markdown'));
});

test('verified dossier home keeps five sections and Loom history', () => {
  assert.deepEqual(
    VERIFIED_DOSSIER_SECTIONS.map((section) => section.label),
    ['About', 'UNSW / ECON3202', 'Quantnet', 'WQU', 'Claude'],
  );
  assert.deepEqual(
    VERIFIED_DOSSIER_HISTORY.map((item) => item.title),
    ['Original Loom', 'Private Wiki', 'Knowledge identity', 'Platform for everyone'],
  );
});

test('verified dossier AI prompt is source-grounded and not generic chat', () => {
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.question, /Phillips Curve/);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /inflation and unemployment/i);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /expectations/i);
  assert.match(VERIFIED_DOSSIER_AI_PROMPT.answer, /supply shocks/i);
  assert.ok(VERIFIED_DOSSIER_AI_PROMPT.citations.length >= 3);
});
