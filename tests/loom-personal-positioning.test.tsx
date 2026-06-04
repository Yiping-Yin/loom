import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';

import { HomeClient } from '../app/HomeClient';
import { VERIFIED_DOSSIER_HOME_COPY } from '../lib/new-loom/verified-dossier-home';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('home first paint frames Loom as an inspectable personal knowledge identity', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const primaryNavHtml = html.match(/<div class="vd-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';
  const categorySectionHtml = html.match(/<section class="vd-personal-categories"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.match(html, /Yiping Yin/);
  assert.match(html, /Source-backed personal profile/);
  assert.match(html, /About, education, experience, and Digital Me are backed by real sources/);
  assert.match(html, /Built with Loom/);
  assert.match(html, /Loom trust layer/);
  assert.match(html, /class="vd-personal-stage"/);
  assert.match(categorySectionHtml, /class="[^"]*\bvd-category-visual\b/);
  assert.match(categorySectionHtml, /class="[^"]*\bvd-category-visual__media\b/);
  assert.match(categorySectionHtml, /alt="Profile source"/);
  assert.match(categorySectionHtml, /alt="Course shelves"/);
  assert.match(categorySectionHtml, /alt="Project proof"/);
  assert.match(categorySectionHtml, /Answer canvas/);
  assert.match(categorySectionHtml, /Cited answer routed into a personal interface/);
  assert.doesNotMatch(categorySectionHtml, /Problem Set 02\.pdf/);
  assert.doesNotMatch(categorySectionHtml, /W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(categorySectionHtml, /UNSW, QuantNet, WQU, Claude Certificate/);
  assert.match(html, /Course shelves/);
  assert.match(html, /Answer canvas/);
  assert.match(html, /real sources|Real files/);
  assert.match(html, /trust mechanism/i);
  assert.match(html, /proof|evidence/i);
  assert.match(html, /href="#loom-trust-layer" aria-label="Open Loom trust layer"/);

  for (const label of ['About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }

  for (const label of [
    'About',
    'Education',
    'Experience',
    'Digital Me',
    'Sources',
    'Draft',
    'Problem Set 02.pdf',
    'W8 A Concave-Functions.pdf',
    '1 source file / 1 shelf',
    '5 source files / 4 shelves',
    '3 source files / 3 shelves',
    'Concavity and optimisation summary.md',
    'Original Loom',
    'Private Wiki',
  ]) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(html, /Verified source workspace/);
  assert.doesNotMatch(html, /Sources become cited work/);
  assert.doesNotMatch(html, /Source Dossier/);
  assert.doesNotMatch(html, /Ask this profile/);
  assert.doesNotMatch(html, /Ask a follow-up/);
  assert.doesNotMatch(html, /Self-introduction, direction, public links, and source-backed identity\./);
  assert.doesNotMatch(html, /Courses, coursework, certificates, and learning outputs backed by real files\./);
  assert.doesNotMatch(html, /vd-loom-intro-link/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(html, /id="cited-answer"/);
  assert.doesNotMatch(html, /Problem Set 02\.pdf \/ W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(html, /One workspace for source material, one surface for writing from it\./);
  assert.doesNotMatch(html, /personal knowledge display platform/i);
  assert.doesNotMatch(html, /Recent progress|Product story|Process timeline|Output previews/);
  assert.doesNotMatch(html, /students, researchers, editors, and anyone/i);
  assert.doesNotMatch(html, /[\u3400-\u9fff]/);
});

test('verified dossier data contract keeps the approved short definition', () => {
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    'About, education, experience, and Digital Me are backed by real sources, drafts, and cited outputs.',
  );
});

test('Sources and Draft descriptions serve personal learning paths, resources, portfolio, and process work', () => {
  const productShell = read('lib/new-loom/product-shell.ts');

  assert.match(productShell, /learning paths/i);
  assert.match(productShell, /resources/i);
  assert.match(productShell, /portfolio/i);
  assert.match(productShell, /process/i);
  assert.doesNotMatch(productShell, /one workspace/i);
});

test('visible support surfaces use approved personal-identity and local-app positioning', () => {
  const about = read('app/about/AboutClient.tsx');
  const verifiedDossierData = read('lib/new-loom/verified-dossier-home.ts');
  const help = read('app/help/page.tsx');
  const productHistory = read('app/product-history/page.tsx');
  const privacy = read('public/privacy.html');
  const support = read('public/support.html');

  assert.match(about, /personal knowledge postcard/i);
  assert.match(about, /learning paths/i);
  assert.match(about, /identity that can be inspected and talked to/i);
  assert.match(about, /Proof/);
  assert.match(about, /about-doc/);
  assert.match(verifiedDossierData, /About me page\.docx/);
  assert.match(about, /First proof shelf', 'UNSW'/);
  assert.match(about, /Ask this profile/);
  assert.match(about, /Product story/i);
  assert.match(about, /\/product-history/);
  assert.doesNotMatch(about, /Yiping's Loom/);
  assert.doesNotMatch(about, /[\u3400-\u9fff]/);

  assert.match(help, /reading-and-thinking environment/i);
  assert.match(help, /source-bound understanding/i);
  assert.match(help, /\/about/);

  assert.match(productHistory, /Why Loom is called Loom/i);
  assert.match(productHistory, /Portfolio with proof/i);
  assert.match(productHistory, /Source to identity/i);
  assert.match(productHistory, /AI persona/i);

  assert.match(privacy, /local Mac app for personal reading and thinking/i);
  assert.match(privacy, /everything stays on your Mac/i);
  assert.match(support, /local Mac app for reading and thinking/i);
  assert.doesNotMatch([about, help, productHistory, privacy, support].join('\n'), /personal knowledge display platform/i);
});

test('canonical docs no longer present Loom as a generic public product', () => {
  const readme = read('README.md');
  const productDefinition = read('LOOM.md');
  const productRules = read('LOOM_RULES.md');
  const appStoreCopy = read('docs/app-store-copy.md');
  const canonicalDocs = [readme, productDefinition, productRules].join('\n');

  assert.match(readme, /personal knowledge identity platform/i);
  assert.match(readme, /portfolio people can inspect/i);
  assert.match(readme, /knowledge base people can trust/i);
  assert.match(productDefinition, /personal knowledge\s*>?\s*identity platform/i);
  assert.match(productDefinition, /Yiping's Loom is the first reference instance/i);
  assert.match(productRules, /personal knowledge identity platform/i);
  assert.match(productRules, /reference instance, not the product boundary/i);
  assert.match(appStoreCopy, /Canonical metadata for the first Mac App Store submission/i);
  assert.match(appStoreCopy, /Your files stay on your Mac/i);

  for (const retired of [
    /personal knowledge display platform/i,
    /Collect, organize, draft/i,
    /source-bound knowledge display platform/i,
  ]) {
    assert.doesNotMatch(canonicalDocs, retired);
  }
});
