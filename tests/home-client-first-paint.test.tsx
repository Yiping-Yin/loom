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
  const primaryNavHtml = html.match(/<div class="vd-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';

  for (const label of [
    'Yiping Yin',
    'Student',
    'Builder',
    'Learner',
    'Sydney, Australia',
    'About',
    'Education',
    'Experience',
    'Digital Me',
    'Built with Loom',
    'Sources',
    'Draft',
    'real sources',
    'Cited answer',
    'UNSW',
    'ECON 3202',
    'MATH 2991',
    'FINS 3666',
    'WQU',
    'Claude',
    'Open Digital Me',
    'No recent Draft',
    'Draft opens after a saved record.',
    'Problem Set 02.pdf',
    'W8 A Concave-Functions.pdf',
    'W8 C Suggested Exercises.pdf',
    'About me page.docx',
    'QuantNet Online C++ Course.pdf',
    'WQU index.html',
    'Claude Certificate.html',
    'concavity',
    'first-order conditions',
  ]) {
    assert.match(text, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const label of ['About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }

  for (const retiredPrimaryNav of ['Quantnet', 'WQU', 'Claude', 'History']) {
    assert.doesNotMatch(
      primaryNavHtml,
      new RegExp(`>${retiredPrimaryNav.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`),
    );
  }

  assert.equal(text.match(/Cited answer/g)?.length ?? 0, 1);
  assert.match(html, /class="vd-home/);
  assert.match(html, /class="vd-workbench-grid"/);
  assert.match(html, /class="vd-active-story/);
  assert.match(html, /class="vd-source-graph/);
  assert.match(
    html,
    /<a class="vd-search vd-loom-intro-link" href="#loom-intro" aria-label="How this profile is built with Loom">/,
  );
  assert.match(html, /<nav class="vd-profile-links" aria-label="Profile links">/);
  assert.match(html, /<aside id="cited-answer" class="vd-inspector" aria-label="Cited answer">/);
  assert.doesNotMatch(text, /Verified source workspace/);
  assert.doesNotMatch(text, /Sources become cited work/);
  assert.doesNotMatch(text, /Source index/);
  assert.doesNotMatch(text, /blocking onboarding/);
  assert.doesNotMatch(text, /Answer inspector/);
  assert.doesNotMatch(text, /Selected trail/);
  assert.doesNotMatch(text, /Problem-set evidence/);
  assert.doesNotMatch(text, /Lecture source/);
  assert.doesNotMatch(text, /Exercise source/);
  assert.doesNotMatch(text, /Problem context/);
  assert.doesNotMatch(text, /Concept source/);
  assert.doesNotMatch(text, /source links/);
  assert.doesNotMatch(text, /Source Dossier/);
  assert.doesNotMatch(text, /Ask this profile/);
  assert.doesNotMatch(text, /Ask a follow-up/);
  assert.doesNotMatch(text, /Open recent Draft/);
  assert.doesNotMatch(text, /Open Draft/);
  assert.doesNotMatch(text, /UNSW \/ ECON3202/);
  assert.doesNotMatch(html, /href="\/draft"/);
  assert.doesNotMatch(html, /id="ask-this-profile"/);
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
  assert.doesNotMatch(html, /placeholder="Search this profile"/);
  assert.doesNotMatch(html, /placeholder="Follow-up disabled in static preview"/);
  assert.doesNotMatch(html, /type="search"/);
  assert.doesNotMatch(html, /<kbd>⌘K<\/kbd>/);
  assert.doesNotMatch(text, /⌘K/);
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
