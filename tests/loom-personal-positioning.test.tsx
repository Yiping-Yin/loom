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

  assert.match(html, /A knowledge profile people can inspect and ask\./);
  assert.match(
    html,
    /Sources, drafts, projects, and conversations become a public record/,
  );
  assert.match(html, /sources, learning path, work, process records, and AI conversations/i);
  assert.match(html, /work/);
  assert.match(html, /process records/);
  assert.match(html, /AI conversations|AI/i);
  assert.match(html, /Knowledge identity/);
  assert.match(html, /proof|evidence/i);

  for (const shelf of ['About', 'UNSW', 'Quantnet', 'WQU', 'Claude']) {
    assert.match(html, new RegExp(shelf));
  }

  for (const label of [
    'Sources',
    'Draft',
    'ECON3202 Problem Set 2.pdf',
    'Lecture 8 Slides.pptx',
    'About me page.docx',
    'BHP Case Study.xlsx',
    'Prompt library.md',
    'PDF',
    'PPTX',
    'DOCX',
    'XLSX',
    'MD',
    'Sources to Draft to Answer',
    'Ask this profile',
    'Phillips Curve',
    'Original Loom',
    'Private Wiki',
    'Knowledge identity',
  ]) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(html, /One workspace for source material, one surface for writing from it\./);
  assert.doesNotMatch(html, /personal knowledge display platform/i);
  assert.doesNotMatch(html, /Recent progress|Product story|Process timeline|Output previews/);
  assert.doesNotMatch(html, /students, researchers, editors, and anyone/i);
  assert.doesNotMatch(html, /[\u3400-\u9fff]/);
});

test('verified dossier data contract keeps the approved short definition', () => {
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    'Loom turns your sources, learning path, work, process records, and AI conversations into an inspectable personal knowledge identity.',
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
  const help = read('app/help/page.tsx');
  const productHistory = read('app/product-history/page.tsx');
  const privacy = read('public/privacy.html');
  const support = read('public/support.html');

  assert.match(about, /personal knowledge postcard/i);
  assert.match(about, /learning paths/i);
  assert.match(about, /identity that can be inspected and talked to/i);
  assert.match(about, /Proof/);
  assert.match(about, /Product story/i);
  assert.match(about, /\/product-history/);

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
