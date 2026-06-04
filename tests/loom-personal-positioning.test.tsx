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

function cssBlock(css: string, selector: string, requiredContent?: string) {
  let searchFrom = 0;

  while (searchFrom < css.length) {
    const start = css.indexOf(`${selector} {`, searchFrom);
    assert.notEqual(start, -1, `${selector} block should exist`);

    const openBrace = css.indexOf('{', start);
    let depth = 0;
    let advanced = false;
    for (let index = openBrace; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') {
        depth -= 1;
        if (depth === 0) {
          const block = css.slice(start, index + 1);
          if (!requiredContent || block.includes(requiredContent)) return block;
          searchFrom = index + 1;
          advanced = true;
          break;
        }
      }
    }
    if (!advanced) assert.fail(`${selector} block should close`);
  }

  assert.fail(`${selector} block should include ${requiredContent}`);
}

test('home first paint frames Loom as an inspectable personal knowledge identity', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const primaryNavHtml = html.match(/<div class="vd-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';

  assert.match(html, /Yiping Yin/);
  assert.match(html, /Student · Builder · Learner · Sydney, Australia/);
  assert.match(html, /class="vd-home vd-home--cover"/);
  assert.match(html, /class="vd-personal-stage"/);
  assert.match(html, /href="\/loom" aria-label="Open Loom product"/);
  assert.match(html, /class="vd-personal-showcase"/);
  assert.match(html, /class="vd-personal-category-stack"/);
  assert.equal((html.match(/class="vd-personal-category-card(?:\s|")/g) ?? []).length, 4);
  assert.ok((html.match(/class="vd-category-visual\b/g) ?? []).length >= 4);
  assert.match(html, /\/profile\/yiping-profile-photo\.png/);
  assert.match(html, /\/brand\/unsw\/unsw-crest\.png/);
  assert.match(html, /\/brand\/wqu\/wqu-logo\.svg/);
  assert.match(html, /\/brand\/quantnet\/quantnet-logo\.png/);
  assert.match(html, /\/verified-sources\/quantnet\/python-foundations\.png/);
  assert.match(html, /\/verified-sources\/econ3202\/problem2-answer\.png/);
  assert.doesNotMatch(html, /class="vd-home-asset-grid"/);
  assert.doesNotMatch(html, /vd-home-asset-grid__/);
  assert.doesNotMatch(html, /class="vd-profile-asset"/);
  assert.doesNotMatch(html, /class="vd-institution-badge"/);
  assert.doesNotMatch(html, /class="vd-document-preview-asset\b/);
  assert.doesNotMatch(html, /class="vd-course-asset-row"/);
  assert.doesNotMatch(html, /class="vd-process-step-asset\b/);
  assert.doesNotMatch(html, /Problem Set 02\.pdf/);
  assert.doesNotMatch(html, /W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(html, /Python Foundations\.pdf/);
  assert.doesNotMatch(html, /Open Digital Me/);
  assert.doesNotMatch(html, /Open Sources/);
  assert.doesNotMatch(html, /class="vd-avatar"/);
  assert.doesNotMatch(html, /vd-personal-stage__photo/);

  for (const label of ['About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }
  assert.doesNotMatch(primaryNavHtml, />Home</);
  assert.doesNotMatch(primaryNavHtml, />Draft</);
  assert.doesNotMatch(primaryNavHtml, /href="\/drafts?"/);

  for (const label of [
    'About',
    'Education',
    'Experience',
    'Digital Me',
  ]) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(html, /Built with Loom/);
  assert.doesNotMatch(html, /Loom trust layer/);
  assert.doesNotMatch(html, /Sources and Draft proof/);
  assert.doesNotMatch(html, /Cited answer sample/);
  assert.doesNotMatch(html, /Loom is the underlying trust mechanism/);
  assert.doesNotMatch(html, /href="#loom-trust-layer"/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /aria-label="Loom history"/);
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

test('personal positioning CSS keeps the Home cover visual and non-operational', () => {
  const css = read('app/globals.css');
  const coverNav = cssBlock(css, '.vd-home--cover > .vd-nav');
  const personalStage = cssBlock(css, '.vd-personal-stage');
  const showcase = cssBlock(css, '.vd-personal-showcase');
  const categoryStack = cssBlock(css, '.vd-personal-category-stack');
  const categoryCard = cssBlock(css, '.vd-personal-category-card');
  const categoryVisual = cssBlock(css, '.vd-category-visual', 'aspect-ratio');
  const categoryMedia = cssBlock(css, '.vd-category-visual__media');
  const categoryMediaImage = cssBlock(css, '.vd-category-visual__media img');
  const mobileShowcase = cssBlock(css, '@media (max-width: 680px)', '.vd-personal-showcase');
  const mobileStack = cssBlock(css, '@media (max-width: 680px)', '.vd-personal-category-stack');

  assert.match(coverNav, /display:\s*flex/);
  assert.match(coverNav, /justify-content:\s*center/);
  assert.match(personalStage, /grid-template-columns:\s*minmax\(17rem,\s*0\.44fr\)\s+minmax\(0,\s*1\.56fr\)/);
  assert.match(showcase, /grid-template-columns:\s*minmax\(20rem,\s*1\.05fr\)\s+minmax\(16rem,\s*0\.85fr\)/);
  assert.match(showcase, /min-height:\s*clamp\(32rem,\s*64vh,\s*46rem\)/);
  assert.match(categoryStack, /display:\s*grid/);
  assert.match(categoryStack, /grid-template-rows:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(categoryCard, /position:\s*relative/);
  assert.match(categoryCard, /min-height:\s*0/);
  assert.match(categoryVisual, /aspect-ratio:\s*auto/);
  assert.match(categoryVisual, /overflow:\s*hidden/);
  assert.match(categoryMedia, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(categoryMediaImage, /object-fit:\s*cover/);
  assert.match(mobileShowcase, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(mobileStack, /grid-template-rows:\s*repeat\(3,\s*minmax\(13\.4rem,\s*auto\)\)/);
  assert.doesNotMatch(css, /vd-home-asset-grid/);
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
  const loomRoute = read('app/loom/page.tsx');
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

  assert.match(loomRoute, /Loom · Product System/);
  assert.doesNotMatch(loomRoute, /Loom · History/);

  assert.match(productHistory, /Loom is a cognitive growth system/i);
  assert.match(productHistory, /source-backed thinking into personal growth/i);
  assert.match(productHistory, /Library \/ Eyes \/ Memory/i);
  assert.match(productHistory, /past material reaches the present/i);
  assert.match(productHistory, /present attention becomes judgment/i);
  assert.match(productHistory, /judged understanding reaches the future/i);
  assert.match(productHistory, /Human \/ System \/ AI/i);
  assert.match(productHistory, /attention, questions, judgment, and relation choices/i);
  assert.match(productHistory, /anchoring, organization, connection, and preservation/i);
  assert.match(productHistory, /AI accelerates inference/i);
  assert.match(productHistory, /Source is sacred/i);
  assert.match(productHistory, /Personal growth loop/i);
  assert.match(productHistory, /Source/);
  assert.match(productHistory, /Attention/);
  assert.match(productHistory, /Question/);
  assert.match(productHistory, /Judgment/);
  assert.match(productHistory, /Practice/);
  assert.match(productHistory, /Draft/);
  assert.match(productHistory, /Output/);
  assert.match(productHistory, /Identity/);
  assert.match(productHistory, /Next source/);
  assert.match(productHistory, /Five product layers/i);
  assert.match(productHistory, /Public identity surface/);
  assert.match(productHistory, /Evidence and source layer/);
  assert.match(productHistory, /Growth and capability layer/);
  assert.match(productHistory, /Cognitive structuring layer/);
  assert.match(productHistory, /AI and production layer/);
  assert.match(productHistory, /Functional reuse and innovation/i);
  assert.match(productHistory, /source shelf/);
  assert.match(productHistory, /citation-backed Digital Me answers/i);
  assert.match(productHistory, /process replay and output production/i);
  assert.match(productHistory, /Product evolution/i);
  assert.match(productHistory, /what was learned/i);
  assert.match(productHistory, /Real evidence assets/i);
  assert.match(productHistory, /\/loom\/history\/early-version\/01-reading-thinking-environment\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/02-name-mark-library-eyes-memory\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/05-weaver-vocabulary\.jpg/);
  assert.match(productHistory, /\/loom\/history\/early-version\/08-paper-reading-source\.jpg/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-04-17-wordmark-structure\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-04-24-frontispiece-vellum\.jpg/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-02-profile-home\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-03-source-dossier\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-04-evidence-workbench\.png/);
  assert.match(productHistory, /\/loom\/history\/evolution\/2026-06-04-current-home\.png/);
  assert.doesNotMatch(productHistory, /VERIFIED_DOSSIER_PROFILE/);
  assert.doesNotMatch(productHistory, /generic SaaS landing page/i);
  assert.doesNotMatch(productHistory, /always-visible AI assistant/i);

  assert.match(privacy, /local Mac app for personal reading and thinking/i);
  assert.match(privacy, /everything stays on your Mac/i);
  assert.match(support, /local Mac app for reading and thinking/i);
  assert.doesNotMatch([about, help, productHistory, privacy, support].join('\n'), /personal knowledge display platform/i);
});

test('Loom product history evolution assets are curated under Loom folders', () => {
  const assetNames = [
    '2026-04-17-wordmark-structure.png',
    '2026-04-24-frontispiece-vellum.jpg',
    '2026-06-02-profile-home.png',
    '2026-06-03-source-dossier.png',
    '2026-06-04-evidence-workbench.png',
    '2026-06-04-current-home.png',
  ];

  for (const assetName of assetNames) {
    assert.ok(
      fs.existsSync(path.join(repoRoot, 'public/loom/history/evolution', assetName)),
      `${assetName} should have a public Loom history copy`,
    );
    assert.ok(
      fs.existsSync(path.join(repoRoot, 'resources/loom-history/evolution', assetName)),
      `${assetName} should have a source Loom history copy`,
    );
  }

  assert.ok(fs.existsSync(path.join(repoRoot, 'resources/loom-history/evolution/README.md')));
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
