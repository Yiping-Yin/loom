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

test('HomeClient first paint is a balanced evidence portal with source-backed destinations', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const text = visibleText(html);
  const primaryNavHtml = html.match(/<div class="lcv-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';

  for (const label of [
    'Yiping Yin',
    '🇨🇳 Wuhan',
    '🇦🇺 Sydney',
    'Quant T/R',
    'AI Founder',
    'About',
    'Education',
    'Experience',
    'Digital Me',
    'ECON 3202',
    'MATH 2991',
    'Data and Algorithms in Trading',
    'FINS 3666',
    'Optiver',
    // The experience ledger row renders the UNSW Research Assistant entry by
    // its CV-backed role rather than the retired "UNSW RA" preview label.
    'Research Assistant',
  ]) {
    assert.match(text, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(html, /Trading &amp; Market Making/);

  for (const label of ['Home', 'About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }

  for (const retiredPrimaryNav of ['Quantnet', 'WQU', 'Claude', 'History', 'Draft']) {
    assert.doesNotMatch(
      primaryNavHtml,
      new RegExp(`>${retiredPrimaryNav.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`),
    );
  }

  // New "ledger cover" (Home v12): identity rail + numbered evidence ledger.
  assert.match(html, /<main class="vd-home lcv" aria-labelledby="verified-dossier-title">/);
  assert.match(html, /href="\/loom" aria-label="Open Loom product"/);
  assert.match(html, /<a class="lcv-wordmark lcv-serif" href="\/loom"/);
  assert.match(html, /class="lcv-shell"/);
  assert.match(html, /class="lcv-rail"/);
  assert.match(html, /class="lcv-ledger"/);
  // Exactly four numbered ledger rows, one per presentation category.
  assert.equal((html.match(/class="lcv-row lcv-row--/g) ?? []).length, 4);
  assert.match(html, /class="lcv-row lcv-row--about"/);
  assert.match(html, /class="lcv-row lcv-row--education"/);
  assert.match(html, /class="lcv-row lcv-row--experience"/);
  assert.match(html, /class="lcv-row lcv-row--digital-me"/);
  assert.equal((html.match(/class="lcv-row__num"/g) ?? []).length, 4);
  assert.match(html, />01</);
  assert.match(html, />04</);
  // Each ledger row is itself a link to its category destination (the whole
  // row is clickable; there is no separate floating "View details" element).
  assert.doesNotMatch(html, /class="lcv-view"/);
  assert.equal((html.match(/<a class="lcv-row lcv-row--[a-z-]+" href="/g) ?? []).length, 4);
  assert.match(html, /<a class="lcv-row lcv-row--about" href="\/about"/);
  assert.match(html, /<a class="lcv-row lcv-row--education" href="\/education"/);
  assert.match(html, /<a class="lcv-row lcv-row--experience" href="\/experience"/);
  assert.match(html, /<a class="lcv-row lcv-row--digital-me" href="\/digital-me"/);
  // Inline "Open →" affordance lives inside each label block (4 total).
  assert.equal((html.match(/class="lcv-row__open"/g) ?? []).length, 4);
  // Identity rail: photo, three profile links (LinkedIn icon variant).
  assert.match(html, /class="lcv-photo"/);
  assert.match(html, /\/profile\/yiping-profile-photo\.png/);
  assert.equal((html.match(/class="lcv-link-icon/g) ?? []).length, 3);
  assert.match(html, /class="lcv-link-icon lcv-link-icon--linkedin"/);
  assert.match(html, /class="lcv-member">MEMBER SINCE APRIL 2024/);
  // Per-category preview assets.
  assert.match(html, /class="lcv-panel lcv-about"/);
  assert.match(html, /class="lcv-cv"/);
  assert.match(text, /CURRICULUM VITAE/);
  assert.match(text, /CV \/ Résumé/);
  assert.match(html, /class="lcv-panel lcv-edu"/);
  assert.match(html, /class="lcv-edu__logos"/);
  assert.match(html, /\/brand\/unsw\/unsw-crest\.png/);
  assert.match(html, /\/brand\/wqu\/wqu-logo\.svg/);
  assert.match(html, /\/brand\/quantnet\/quantnet-logo\.png/);
  assert.match(html, /\/brand\/claude\/claude-icon\.png/);
  assert.match(html, /class="lcv-edu__chips"/);
  assert.match(html, /more courses/);
  assert.equal((html.match(/class="lcv-exp__card"/g) ?? []).length, 2);
  assert.match(html, /class="lcv-panel lcv-dm"/);
  assert.match(html, /class="lcv-dm__flow"/);
  assert.match(html, /class="lcv-dm__table"/);
  assert.match(html, /class="lcv-dm__graph"/);
  assert.match(text, /How does concavity connect to optimisation/);
  // Verified-source pills: four ledger rows plus the two experience cards.
  assert.equal((html.match(/class="lcv-verified"/g) ?? []).length, 6);
  assert.match(text, /Verified source/);
  assert.match(text, /Verified sources/);
  // Footer source-of-truth callout.
  assert.match(html, /class="lcv-foot"/);
  assert.match(text, /LOOM — PERSONAL KNOWLEDGE, BACKED BY REAL SOURCES/);
  assert.match(html, /<a class="lcv-foot__all" href="\/sources">/);
  assert.match(text, /VIEW ALL SOURCES/);
  assert.match(text, /Turning scattered knowledge/);
  // Retired markup must NOT reappear under any of the legacy cover names.
  assert.doesNotMatch(html, /vd-home--cover/);
  assert.doesNotMatch(html, /vd-cover-composition/);
  assert.doesNotMatch(html, /vd-portrait-cover/);
  assert.doesNotMatch(html, /vd-proof-covers?/);
  assert.doesNotMatch(html, /vd-hybrid-grid|vd-hybrid-covers/);
  assert.doesNotMatch(html, /vd-cover-art/);
  assert.doesNotMatch(html, /vd-cover-link/);
  assert.doesNotMatch(html, /vd-home-optibook-shot/);
  assert.doesNotMatch(html, /vd-personal-stage/);
  assert.doesNotMatch(html, /class="vd-home-answer-canvas"/);
  assert.doesNotMatch(html, /class="vd-home-proof-steps"/);
  assert.doesNotMatch(html, /class="vd-home-mini-table"/);
  assert.doesNotMatch(html, /class="vd-home-asset-grid"/);
  assert.doesNotMatch(html, /vd-home-asset-grid__/);
  assert.doesNotMatch(html, /class="vd-profile-card"/);
  assert.doesNotMatch(html, /class="vd-dossier"/);
  assert.doesNotMatch(html, /class="vd-resume-safe-preview"/);
  assert.doesNotMatch(html, /class="vd-evidence-row"/);
  assert.doesNotMatch(html, /class="vd-profile-asset"/);
  assert.doesNotMatch(html, /class="vd-institution-badge"/);
  assert.doesNotMatch(html, /class="vd-document-preview-asset\b/);
  assert.doesNotMatch(html, /class="vd-course-asset-row"/);
  assert.doesNotMatch(html, /class="vd-process-step-asset\b/);
  assert.doesNotMatch(html, /Market Lens/);
  assert.doesNotMatch(html, /Source memory/);
  assert.doesNotMatch(html, /NVDA/);
  assert.doesNotMatch(html, /SPY/);
  assert.doesNotMatch(html, /class="vd-avatar"/);
  assert.doesNotMatch(html, /<aside id="cited-answer" class="vd-inspector"/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(text, /No recent Draft/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /vd-home-source-preview/);
  assert.doesNotMatch(html, /vd-home-route-rail/);
  assert.doesNotMatch(html, /vd-home-provenance/);
  assert.doesNotMatch(text, /Evidence Portal/);
  assert.doesNotMatch(text, /Explore the source-backed systems/);
  assert.doesNotMatch(text, /LAST UPDATED 2025-06-05/);
  // The ledger now renders each category summary verbatim, so the about
  // ("Self-introduction…"), education ("Courses, coursework…") and experience
  // ("Projects, work, competitions…") summaries are expected to appear. The
  // retired *standalone-asset-grid* descriptions below must still be absent.
  assert.doesNotMatch(text, /Projects, research, and built systems/);
  assert.doesNotMatch(text, /Local Optibook, market memory/);
  // "CV / Resume" (ASCII e) must stay absent; the design uses "Résumé".
  assert.doesNotMatch(text, /CV \/ Resume\b/);
  assert.doesNotMatch(text, /Open About/);
  assert.doesNotMatch(text, /Open Education/);
  assert.doesNotMatch(text, /Open Experience/);
  assert.doesNotMatch(text, /Open Digital Me/);
  assert.doesNotMatch(text, /Live system/);
  assert.doesNotMatch(text, /Sources → Reasoning → Artifact/);
  assert.doesNotMatch(text, /Problem Set 02\.pdf/);
  assert.doesNotMatch(text, /W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(text, /Profile notes and public context/);
  assert.doesNotMatch(text, /Cited answers, process replay/);
  assert.doesNotMatch(primaryNavHtml, /href="\/drafts?"/);
  assert.doesNotMatch(text, /Yiping's Loom/);
  assert.doesNotMatch(text, /[\u3400-\u9fff]/);
  assert.doesNotMatch(text, /\b(?:panel|panels|pursuit|pursuits|weave|weaves)\b/i);
  assert.doesNotMatch(html, />\s*&nbsp;\s*</i);
});

test('HomeClient stays a static profile surface without operational plumbing', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/HomeClient.tsx'), 'utf8');

  assert.match(source, /<VerifiedDossierHome \/>/);
  assert.doesNotMatch(source, /VerifiedDossierAssetHome/);
  assert.doesNotMatch(source, /RECENT_RECORDS_KEY/);
  assert.doesNotMatch(source, /loadLatestRecentRecord/);
  assert.doesNotMatch(source, /subscribeLoomMirror/);
  // callNativeBridge('navigate', …) is the new-loom skeleton's capability
  // passthrough (pinned by new-loom-skeleton-contract.test.ts); a minimal
  // navigate bridge is consistent with a static profile surface.
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

test('white dashboard homepage is retired into the hybrid evidence cover design', () => {
  const homeSource = fs.readFileSync(
    path.join(repoRoot, 'components/verified-dossier/VerifiedDossierHome.tsx'),
    'utf8',
  );
  const dataSource = fs.readFileSync(
    path.join(repoRoot, 'lib/new-loom/verified-dossier-home.ts'),
    'utf8',
  );
  const cssSource = fs.readFileSync(path.join(repoRoot, 'app/globals.css'), 'utf8');

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/verified-dossier/VerifiedDossierAssetHome.tsx')),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/verified-dossier/AssetPrimitives.tsx')),
    false,
  );
  // The component is the Home v12 "ledger cover": a CoverAsset preview per
  // category, data-driven from the canonical presentation/course/workbench
  // models, and rendered under the isolated `.lcv-*` namespace.
  assert.match(homeSource, /CoverAsset/);
  assert.match(homeSource, /VERIFIED_DOSSIER_PRESENTATION_CATEGORIES/);
  assert.match(homeSource, /VERIFIED_DOSSIER_UNSW_COURSES/);
  // Digital Me preview now reuses the canonical Sources → Draft → Answer
  // workbench provenance steps, so the import is expected (was forbidden in v11).
  assert.match(homeSource, /VERIFIED_DOSSIER_WORKBENCH/);
  assert.match(homeSource, /lcv-shell/);
  assert.match(homeSource, /lcv-rail/);
  assert.match(homeSource, /lcv-ledger/);
  assert.match(homeSource, /lcv-row lcv-row--\$\{cat\.id\}/);
  assert.match(homeSource, /lcv-panel lcv-about/);
  assert.match(homeSource, /lcv-panel lcv-edu/);
  assert.match(homeSource, /lcv-exp__card/);
  assert.match(homeSource, /lcv-panel lcv-dm/);
  assert.match(homeSource, /lcv-link-icon--linkedin/);
  // The retired cover/asset-grid implementations must be gone from the component.
  assert.doesNotMatch(homeSource, /vd-hybrid-grid|vd-hybrid-covers/);
  assert.doesNotMatch(homeSource, /vd-cover-art/);
  assert.doesNotMatch(homeSource, /vd-cover-link/);
  assert.doesNotMatch(homeSource, /vd-home-optibook-shot/);
  assert.doesNotMatch(homeSource, /vd-portrait-cover/);
  assert.doesNotMatch(homeSource, /vd-proof-covers?/);
  assert.doesNotMatch(homeSource, /vd-personal-stage/);
  assert.doesNotMatch(homeSource, /vd-home-answer-canvas/);
  assert.doesNotMatch(homeSource, /SourcePreview/);
  assert.doesNotMatch(homeSource, /ProvenanceProof/);
  assert.doesNotMatch(homeSource, /vd-home-source-preview/);
  assert.doesNotMatch(homeSource, /vd-home-route-rail/);
  assert.doesNotMatch(homeSource, /VerifiedDossierAssetHome/);
  assert.doesNotMatch(homeSource, /AssetPrimitives/);
  assert.doesNotMatch(homeSource, /vd-home-asset-grid/);
  assert.doesNotMatch(dataSource, /VERIFIED_DOSSIER_ASSET_MANIFEST/);
  // CSS ships the isolated Home v12 ledger-cover block.
  assert.match(cssSource, /Home v12: ledger cover/);
  assert.match(cssSource, /\.lcv-shell/);
  assert.match(cssSource, /\.lcv-rail/);
  assert.match(cssSource, /\.lcv-row\b/);
  assert.match(cssSource, /\.lcv-nav\b/);
  assert.match(cssSource, /\.lcv-link-icon--linkedin/);
  assert.doesNotMatch(cssSource, /vd-home-asset-grid/);
  assert.doesNotMatch(cssSource, /vd-profile-asset/);
  assert.doesNotMatch(cssSource, /vd-document-preview-asset/);
  assert.doesNotMatch(cssSource, /vd-course-asset-row/);
  assert.doesNotMatch(cssSource, /vd-process-step-asset/);
});
