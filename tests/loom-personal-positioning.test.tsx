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
  const selectorPattern = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const selectorRegex = new RegExp(`${selectorPattern}\\s*\\{`, 'g');
  let match = selectorRegex.exec(css);

  while (match) {
    const start = match.index;
    const openBrace = css.indexOf('{', start);
    let depth = 0;
    for (let index = openBrace; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') {
        depth -= 1;
        if (depth === 0) {
          const block = css.slice(start, index + 1);
          if (!requiredContent || block.includes(requiredContent)) {
            return block;
          }
          match = selectorRegex.exec(css);
          break;
        }
      }
    }
    if (!match) assert.fail(`${selector} block should include ${requiredContent}`);
  }

  assert.fail(`${selector} block should include ${requiredContent}`);
}

test('home first paint frames Loom as an inspectable personal knowledge identity', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const primaryNavHtml = html.match(/<div class="lcv-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';

  assert.match(html, /Yiping Yin/);
  assert.match(html, /🇨🇳 Wuhan/);
  assert.match(html, /🇦🇺 Sydney/);
  assert.match(html, /Quant T\/R/);
  assert.match(html, /AI Founder/);
  // Home v12 ledger cover: an inspectable identity rail beside a numbered
  // evidence ledger, every row carrying a verified-source pill and a
  // View-details link to its own destination.
  assert.match(html, /<main class="vd-home lcv" aria-labelledby="verified-dossier-title">/);
  assert.match(html, /href="\/loom" aria-label="Open Loom product"/);
  assert.match(html, /class="lcv-shell"/);
  assert.match(html, /class="lcv-rail"/);
  assert.match(html, /class="lcv-ledger"/);
  assert.equal((html.match(/class="lcv-row lcv-row--/g) ?? []).length, 4);
  assert.match(html, /class="lcv-row lcv-row--about"/);
  assert.match(html, /class="lcv-row lcv-row--education"/);
  assert.match(html, /class="lcv-row lcv-row--experience"/);
  assert.match(html, /class="lcv-row lcv-row--digital-me"/);
  assert.equal((html.match(/class="lcv-row__num"/g) ?? []).length, 4);
  assert.equal((html.match(/class="lcv-view"/g) ?? []).length, 4);
  assert.match(html, /<a class="lcv-view" href="\/about">/);
  assert.match(html, /<a class="lcv-view" href="\/education">/);
  assert.match(html, /<a class="lcv-view" href="\/experience">/);
  assert.match(html, /<a class="lcv-view" href="\/digital-me">/);
  assert.equal((html.match(/class="lcv-verified"/g) ?? []).length, 6);
  assert.match(html, /class="lcv-photo"/);
  assert.match(html, /\/profile\/yiping-profile-photo\.png/);
  assert.equal((html.match(/class="lcv-link-icon/g) ?? []).length, 3);
  assert.match(html, /class="lcv-link-icon lcv-link-icon--linkedin"/);
  assert.match(html, /class="lcv-panel lcv-about"/);
  assert.match(html, /class="lcv-cv"/);
  assert.match(html, /class="lcv-panel lcv-edu"/);
  assert.match(html, /class="lcv-edu__logos"/);
  assert.match(html, /\/brand\/unsw\/unsw-crest\.png/);
  assert.match(html, /\/brand\/wqu\/wqu-logo\.svg/);
  assert.match(html, /\/brand\/quantnet\/quantnet-logo\.png/);
  assert.match(html, /\/brand\/claude\/claude-icon\.png/);
  assert.equal((html.match(/class="lcv-exp__card"/g) ?? []).length, 2);
  assert.match(html, /class="lcv-panel lcv-dm"/);
  assert.match(html, /class="lcv-dm__flow"/);
  // The identity rail now lists real memberships (UNSW Sydney / WorldQuant /
  // QuantNet) as source-backed affiliations — legitimate profile content that
  // fills the rail instead of leaving it hollow below the pull-quote.
  assert.match(html, /class="lcv-members"/);
  assert.equal((html.match(/class="lcv-members__item/g) ?? []).length, 3);
  assert.match(html, /ECON 3202/);
  assert.match(html, /MATH 2991/);
  assert.match(html, /FINS 3666/);
  assert.match(html, /more courses/);
  assert.match(html, /Optiver/);
  // UNSW Research Assistant experience row uses its CV-backed role label.
  assert.match(html, /Research Assistant/);
  assert.doesNotMatch(html, /class="vd-home-answer-canvas"/);
  assert.doesNotMatch(html, /class="vd-home-proof-steps"/);
  assert.doesNotMatch(html, /class="vd-home-mini-table"/);
  assert.doesNotMatch(html, /class="vd-profile-card"/);
  assert.doesNotMatch(html, /class="vd-dossier"/);
  assert.doesNotMatch(html, /class="vd-resume-safe-preview"/);
  assert.doesNotMatch(html, /class="vd-evidence-row"/);
  assert.doesNotMatch(html, /class="vd-home-asset-grid"/);
  assert.doesNotMatch(html, /vd-home-asset-grid__/);
  assert.doesNotMatch(html, /class="vd-profile-asset"/);
  assert.doesNotMatch(html, /class="vd-institution-badge"/);
  assert.doesNotMatch(html, /class="vd-document-preview-asset\b/);
  assert.doesNotMatch(html, /class="vd-course-asset-row"/);
  assert.doesNotMatch(html, /class="vd-process-step-asset\b/);
  assert.doesNotMatch(html, /Market Lens/);
  assert.doesNotMatch(html, /Source memory/);
  assert.doesNotMatch(html, /NVDA/);
  assert.doesNotMatch(html, /SPY/);
  assert.doesNotMatch(html, /Python Foundations\.pdf/);
  assert.doesNotMatch(html, /\/verified-sources\/about\/cv-yiping-yin\.pdf/);
  assert.doesNotMatch(html, /Open Sources/);
  assert.doesNotMatch(html, /class="vd-avatar"/);
  assert.doesNotMatch(html, /vd-personal-stage__photo/);
  assert.doesNotMatch(html, /vd-home-source-preview/);
  assert.doesNotMatch(html, /vd-home-route-rail/);
  assert.doesNotMatch(html, /vd-home-provenance/);

  for (const label of ['Home', 'About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }
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
  assert.doesNotMatch(html, /Cited answer sample/);
  assert.doesNotMatch(html, /Loom is the underlying trust mechanism/);
  assert.doesNotMatch(html, /href="#loom-trust-layer"/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /aria-label="Loom history"/);
  assert.doesNotMatch(html, /Verified source workspace/);
  assert.doesNotMatch(html, /Sources become cited work/);
  assert.doesNotMatch(html, />Evidence Portal</);
  assert.doesNotMatch(html, />Live system</);
  assert.doesNotMatch(html, /Sources → Reasoning → Artifact/);
  // The Digital Me preview frames the concavity question as the inspectable
  // Sources → Draft → Answer flow, so the prompt is expected to render.
  assert.match(html, /How does concavity connect to optimisation/);
  assert.doesNotMatch(html, /Problem Set 02\.pdf/);
  assert.doesNotMatch(html, /W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(html, /Source Dossier/);
  assert.doesNotMatch(html, /Ask this profile/);
  assert.doesNotMatch(html, /Ask a follow-up/);
  assert.doesNotMatch(html, /vd-loom-intro-link/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(html, /id="cited-answer"/);
  assert.doesNotMatch(html, /One workspace for source material, one surface for writing from it\./);
  assert.doesNotMatch(html, /personal knowledge display platform/i);
  assert.doesNotMatch(html, /Recent progress|Product story|Process timeline|Output previews/);
  assert.doesNotMatch(html, /students, researchers, editors, and anyone/i);
  assert.doesNotMatch(html, /[\u3400-\u9fff]/);
  // The ledger cover owns the membership line and the source-of-truth footer.
  assert.match(html, /class="lcv-member">MEMBER SINCE APRIL 2024/);
  assert.match(html, /class="lcv-foot"/);
  assert.match(html, /LOOM — PERSONAL KNOWLEDGE, BACKED BY REAL SOURCES/);
  assert.match(html, /<a class="lcv-foot__all" href="\/sources">/);
});

test('verified dossier data contract keeps the approved short definition', () => {
  assert.equal(
    VERIFIED_DOSSIER_HOME_COPY.shortDefinition,
    'Explore the source-backed systems that define my knowledge, work, and Digital Me.',
  );
});

test('personal positioning CSS keeps the Home cover visual and non-operational', () => {
  const css = read('app/globals.css');
  const coverNav = cssBlock(css, '.vd-home--cover > .vd-nav', 'height: 68px');
  const coverComposition = cssBlock(
    css,
    '.vd-home--cover .vd-personal-stage.vd-cover-composition.vd-hybrid-grid',
    'minmax(20rem, 0.46fr) minmax(0, 1.54fr)',
  );
  const portraitCover = cssBlock(css, '.vd-home--cover .vd-portrait-cover', 'display: grid');
  const headshot = cssBlock(css, '.vd-home--cover .vd-portrait-cover__headshot', 'object-position: center 34%');
  const coverLinks = cssBlock(css, '.vd-home--cover .vd-cover-links', 'repeat(3, minmax(0, 1fr))');
  const coverLink = cssBlock(css, '.vd-home--cover .vd-cover-link', 'justify-content: space-between');
  const linkedinIcon = cssBlock(css, '.vd-home--cover .vd-cover-link__icon--linkedin', 'background: currentColor');
  const proofCovers = cssBlock(
    css,
    '.vd-home--cover .vd-proof-covers.vd-hybrid-covers',
    'display: grid',
  );
  const educationVisual = cssBlock(
    css,
    '.vd-home--cover .vd-proof-cover--education .vd-cover-art--education-hybrid',
    'background:',
  );
  const experienceVisual = cssBlock(
    css,
    '.vd-home--cover .vd-proof-cover--experience .vd-cover-art--experience-hybrid',
    'display: grid',
  );
  const digitalVisual = cssBlock(
    css,
    '.vd-home--cover .vd-proof-cover--digital-me .vd-cover-art--digital-me',
    'display: grid',
  );

  assert.match(coverNav, /display:\s*grid/);
  assert.match(coverNav, /grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto/);
  assert.match(coverNav, /background:\s*#030404/);
  assert.match(coverComposition, /grid-template-columns:\s*minmax\(20rem,\s*0\.46fr\) minmax\(0,\s*1\.54fr\)/);
  assert.match(coverComposition, /width:\s*100%/);
  assert.match(coverComposition, /min-height:\s*calc\(100vh - 5\.1rem\)/);
  assert.match(portraitCover, /display:\s*grid/);
  assert.doesNotMatch(portraitCover, /url\(/);
  assert.match(headshot, /position:\s*relative/);
  assert.match(headshot, /width:\s*clamp\(5\.2rem,\s*6\.2vw,\s*7\.4rem\)/);
  assert.match(headshot, /aspect-ratio:\s*0\.78/);
  assert.match(headshot, /object-fit:\s*cover/);
  assert.match(headshot, /object-position:\s*center 34%/);
  assert.doesNotMatch(headshot, /inset:\s*0/);
  assert.match(coverLinks, /position:\s*relative/);
  assert.match(coverLink, /justify-content:\s*space-between/);
  assert.match(linkedinIcon, /background:\s*currentColor/);
  assert.match(proofCovers, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(proofCovers, /grid-template-rows:\s*repeat\(2,\s*minmax\(15rem,\s*1fr\)\)/);
  assert.match(educationVisual, /background:/);
  assert.match(experienceVisual, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(digitalVisual, /display:\s*grid/);
  assert.doesNotMatch(`${coverNav}\n${coverComposition}\n${portraitCover}\n${proofCovers}`, /#9fcbb6|#a8d5bf|#bfe4d0|rgba\(106,\s*145,\s*126|rgba\(126,\s*166,\s*146/);
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

  assert.match(about, /personal knowledge display platform/i);
  assert.match(about, /backed by sources/i);
  assert.match(about, /readable by people/i);
  assert.match(about, /usable by Digital Me/i);
  assert.match(about, /Proof/);
  assert.match(about, /about-doc/);
  assert.match(about, /\/verified-sources\/about\/cv-yiping-yin\.pdf/);
  assert.match(verifiedDossierData, /About me page\.docx/);
  assert.match(about, /UNSW, WQU, QuantNet, and Claude learning evidence/);
  assert.match(about, /usable by Digital Me/);
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
  assert.doesNotMatch([help, productHistory, privacy, support].join('\n'), /personal knowledge display platform/i);
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
