import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';

import { HomeClient, formatNativeActivitySummary } from '../app/HomeClient';

const repoRoot = path.resolve(__dirname, '..');

function visibleText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');
}

test('HomeClient first paint is not a blank shell when client state has not hydrated yet', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const text = visibleText(html);

  assert.match(text, /A knowledge profile people can inspect and ask\./);
  assert.match(
    text,
    /Sources, drafts, projects, and conversations become a public record/,
  );
  assert.match(text, /一个可展示、可追溯、可交流的个人知识身份/);

  for (const label of [
    'Yiping Yin',
    'Student',
    'Builder',
    'Learner',
    'Sydney, Australia',
    'About',
    'Sources',
    'UNSW',
    'Quantnet',
    'WQU',
    'Claude',
    'History',
    'ECON3202 Problem Set 2.pdf',
    'Lecture 8 Slides.pptx',
    'Tutorial 3 Solutions.pdf',
    'Lecture 8 Notes.pdf',
    'About me page.docx',
    'BHP Case Study.xlsx',
    'Prompt library.md',
    'PDF',
    'PPTX',
    'DOCX',
    'XLSX',
    'MD',
    'Ask this profile',
    'Sources to Draft to Answer',
    'Featured UNSW / ECON3202 evidence',
    'Problem Set 2',
    'Aggregate Demand I',
    'PDF - 1.2 MB - 12 Apr 2024',
    'PPTX - 8.7 MB - 10 Apr 2024',
    'Phillips Curve summary.md',
    'Evidence quality: High',
    'Cited sources from this shelf',
    'Phillips Curve',
    'inflation and unemployment',
    'expectations',
    'supply shocks',
    'Draft',
  ]) {
    assert.match(text, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.equal(text.match(/Ask this profile/g)?.length ?? 0, 1);
  assert.match(html, /class="vd-home/);
  assert.doesNotMatch(html, /placeholder="Ask this profile"/);
  assert.match(html, /placeholder="Search this profile"/);
  assert.match(html, /placeholder="Ask a follow-up\.\.\."/);
  assert.doesNotMatch(text, /Yiping's Loom/);
  assert.doesNotMatch(text, /\b(?:panel|panels|pursuit|pursuits|weave|weaves)\b/i);
  assert.doesNotMatch(html, />\s*&nbsp;\s*</i);
});

test('HomeClient hydrated native activity uses Sources and Draft vocabulary', () => {
  const text = formatNativeActivitySummary({
    panelCount: 2,
    pursuitCount: 1,
    weaveCount: 3,
  });

  assert.equal(text, 'Draft: 2 items, Process: 1 path, Sources: 3 links');
  assert.match(text, /Sources/);
  assert.match(text, /Draft/);
  assert.doesNotMatch(text, /\b(?:panel|panels|pursuit|pursuits|weave|weaves)\b/i);
});

test('HomeClient Open Sources uses literal Sources navigation, not Shuttle', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/HomeClient.tsx'), 'utf8');
  const openSourcesMatch = source.match(/const handleOpenSources = \(\) => \{[\s\S]*?\n  \};/);

  assert.ok(openSourcesMatch, 'HomeClient should define handleOpenSources');
  assert.doesNotMatch(source, /import\s+\{\s*openShuttle\s*\}/);
  assert.doesNotMatch(openSourcesMatch[0], /\bopenShuttle\s*\(/);
  assert.match(openSourcesMatch[0], /const href = '\/knowledge'/);
  assert.match(openSourcesMatch[0], /callNativeBridge\('navigate', \{ href \}\)/);
  assert.match(openSourcesMatch[0], /window\.location\.href = href/);
});
