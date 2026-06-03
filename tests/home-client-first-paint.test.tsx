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

  assert.match(text, /Verified source workspace/);
  assert.match(text, /Sources become cited work/);
  assert.match(text, /Sources\s+→\s+Draft\s+→\s+Answer/);

  for (const label of [
    'Yiping Yin',
    'Student',
    'Builder',
    'Learner',
    'Sydney, Australia',
    'About',
    'Sources',
    'Draft',
    'Sources become cited work',
    'Answer inspector',
    'Verified source workspace',
    'Active evidence story',
    'Source graph',
    'UNSW / ECON3202',
    'Quantnet',
    'WQU',
    'Claude',
    'History',
    'Open Sources',
    'Open recent Draft',
    'Problem Set 02.pdf',
    'W8 A Concave-Functions.pdf',
    'W8 C Suggested Exercises.pdf',
    'Problem2.pdf',
    'About me page.docx',
    'QuantNet Online C++ Course.pdf',
    'Python Foundations.pdf',
    'WQU index.html',
    'Claude Certificate.html',
    'PDF',
    'DOCX',
    'HTML',
    'Problem Set 02',
    'W8 A Concave-Functions.pdf',
    '2 pages - 79 KB - modified 15 Mar 2026',
    '27 pages - 227 KB - modified 06 Apr 2026',
    'UNSW/ECON 3202/03_Problem_Set/Problem Set 02.pdf',
    'UNSW/ECON 3202/02_Week/W08/W8 A Concave-Functions.pdf',
    'Concavity and optimisation summary.md',
    'Cited sources',
    'concavity',
    'first-order conditions',
    'economic choice problem',
    'Draft',
  ]) {
    assert.match(text, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.equal(text.match(/Answer inspector/g)?.length ?? 0, 1);
  assert.match(html, /class="vd-home/);
  assert.match(html, /class="vd-workbench-grid"/);
  assert.match(html, /class="vd-active-story/);
  assert.match(html, /class="vd-source-graph/);
  assert.doesNotMatch(text, /Source Dossier/);
  assert.doesNotMatch(text, /Ask this profile/);
  for (const assetSrc of [
    '/brand/quantnet/quantnet-logo.png',
    '/brand/wqu/wqu-logo.svg',
    '/brand/claude/claude-icon.png',
  ]) {
    assert.match(html, new RegExp(assetSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(text, /A knowledge profile people can inspect and ask\./);
  assert.doesNotMatch(
    text,
    /Sources, drafts, projects, and conversations become a public record/,
  );
  assert.doesNotMatch(
    text,
    /Loom turns your sources, learning path, work, process records, and AI conversations/,
  );
  assert.doesNotMatch(html, /placeholder="Ask this profile"/);
  assert.match(html, /placeholder="Search this profile"/);
  assert.match(html, /placeholder="Follow-up disabled in static preview"/);
  assert.doesNotMatch(text, /[\u3400-\u9fff]/);
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
