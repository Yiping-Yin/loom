import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';

import { HomeClient } from '../app/HomeClient';

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
  const categorySectionHtml = html.match(/<section class="vd-personal-categories"[\s\S]*?<\/section>/)?.[0] ?? '';

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
    'UNSW',
    'WorldQuant University',
    'QuantNet',
    'Profile',
    'Course record',
    'Project evidence',
    'Answer canvas',
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

  assert.match(html, /class="vd-home/);
  assert.match(html, /class="vd-personal-stage"/);
  assert.match(categorySectionHtml, /role="img" aria-label="Profile source"/);
  assert.match(categorySectionHtml, /role="img" aria-label="Course shelves"/);
  assert.match(categorySectionHtml, /role="img" aria-label="Project proof"/);
  assert.match(categorySectionHtml, /role="img" aria-label="Answer canvas"/);
  assert.match(html, /<nav class="vd-profile-links" aria-label="Profile links">/);
  assert.match(html, /<a class="vd-hero-link vd-hero-link--primary" href="\/digital-me">Digital Me/);
  assert.match(html, /<a class="vd-hero-link vd-hero-link--button" href="\/about">Profile<\/a>/);
  assert.doesNotMatch(html, /<aside id="cited-answer" class="vd-inspector"/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(html, /vd-category-visual__caption/);
  assert.doesNotMatch(text, /Workflow/);
  assert.doesNotMatch(text, /Activity/);
  assert.doesNotMatch(text, /No recent Draft/);
  assert.doesNotMatch(text, /Draft opens after a saved record\./);
  assert.doesNotMatch(text, /Built with Loom/);
  assert.doesNotMatch(text, /Loom trust layer/);
  assert.doesNotMatch(text, /Sources and Draft proof/);
  assert.doesNotMatch(text, /Cited answer sample/);
  assert.doesNotMatch(text, /Loom is the underlying trust mechanism/);
  assert.doesNotMatch(html, /vd-loom-intro-link/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /vd-active-story/);
  assert.doesNotMatch(html, /vd-source-graph/);
  assert.doesNotMatch(html, /Problem Set 02\.pdf \/ W8 A Concave-Functions\.pdf/);
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
  assert.doesNotMatch(text, /Open Sources/);
  assert.doesNotMatch(text, /UNSW \/ ECON3202/);
  assert.doesNotMatch(html, /href="\/draft"/);
  assert.doesNotMatch(html, /href="#loom-trust-layer"/);
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

test('HomeClient stays a static portfolio cover without operational plumbing', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/HomeClient.tsx'), 'utf8');

  assert.match(source, /<VerifiedDossierHome \/>/);
  assert.doesNotMatch(source, /RECENT_RECORDS_KEY/);
  assert.doesNotMatch(source, /loadLatestRecentRecord/);
  assert.doesNotMatch(source, /subscribeLoomMirror/);
  assert.doesNotMatch(source, /callNativeBridge/);
  assert.doesNotMatch(source, /handleOpenSources/);
  assert.doesNotMatch(source, /handleOpenRecent/);
  assert.doesNotMatch(source, /loadPanelRecords/);
  assert.doesNotMatch(source, /loadPursuitRecords/);
  assert.doesNotMatch(source, /loadWeaveRecords/);
  assert.doesNotMatch(source, /PANEL_RECORDS_KEY/);
  assert.doesNotMatch(source, /PURSUIT_RECORDS_KEY/);
  assert.doesNotMatch(source, /WEAVE_RECORDS_KEY/);
  assert.doesNotMatch(source, /formatNativeActivitySummary/);
  assert.doesNotMatch(source, /formatHomepageActivitySummary/);
  assert.doesNotMatch(source, /activitySummary=/);
  assert.doesNotMatch(source, /ready=/);
});

test('homepage primary actions stay presentation-oriented', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'components/verified-dossier/VerifiedDossierHome.tsx'), 'utf8');

  assert.match(source, /href="\/digital-me"/);
  assert.match(source, /href="\/about"/);
  assert.doesNotMatch(source, /Open Sources/);
  assert.doesNotMatch(source, /Recent Draft/);
  assert.doesNotMatch(source, /onOpenSources/);
  assert.doesNotMatch(source, /onOpenRecent/);
  assert.doesNotMatch(source, /href=\{draftRecordDetailHref/);
});
