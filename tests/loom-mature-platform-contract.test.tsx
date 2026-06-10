import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';

import { HomeClient } from '../app/HomeClient';
import {
  PERSONAL_PLATFORM_MODEL,
  PERSONAL_PLATFORM_HISTORY,
  PERSONAL_PLATFORM_OUTPUTS,
  PERSONAL_PLATFORM_PROCESS,
  PERSONAL_PLATFORM_PROGRESS,
  PERSONAL_PLATFORM_SECTIONS,
} from '../lib/new-loom/personal-platform';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readRepo(relativePath: string) {
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

test('personal platform data keeps five sections and the mature section model', () => {
  assert.deepEqual(
    PERSONAL_PLATFORM_SECTIONS.map((section) => section.label),
    ['About', 'UNSW', 'Quantnet', 'WQU', 'Claude'],
  );
  assert.deepEqual(PERSONAL_PLATFORM_MODEL, ['Overview', 'Path', 'Sources', 'Process', 'Outputs']);

  for (const section of PERSONAL_PLATFORM_SECTIONS) {
    assert.ok(section.href, `${section.label} should expose a link`);
    assert.ok(section.summary, `${section.label} should expose a summary`);
    assert.ok(section.status, `${section.label} should expose a status`);
    assert.ok(section.nextAction, `${section.label} should expose a next action`);
    assert.ok(section.pathSteps.length >= 2, `${section.label} should expose path steps`);
    assert.ok(section.sourceGroups.length >= 2, `${section.label} should expose source groups`);
    assert.ok(section.processItems.length >= 2, `${section.label} should expose process items`);
    assert.ok(section.outputs.length >= 1, `${section.label} should expose output items`);
  }

  assert.ok(PERSONAL_PLATFORM_PROGRESS.length >= 3, 'home progress strip should have concrete items');
  assert.ok(PERSONAL_PLATFORM_HISTORY.length >= 4, 'product history should keep the Loom story visible');
  assert.ok(PERSONAL_PLATFORM_PROCESS.length >= 3, 'home process timeline should have concrete items');
  assert.ok(PERSONAL_PLATFORM_OUTPUTS.length >= 3, 'home output previews should have concrete items');
  assert.match(PERSONAL_PLATFORM_HISTORY[0].text, /personal thinking tool/i);
  assert.match(
    PERSONAL_PLATFORM_HISTORY[PERSONAL_PLATFORM_HISTORY.length - 1].text,
    /future path toward a platform for everyone/i,
  );
});

test('HomeClient renders mature platform modules on first paint', () => {
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
  // Home v12 ledger cover: identity rail + four numbered evidence rows.
  assert.match(html, /<main class="vd-home lcv" aria-labelledby="verified-dossier-title">/);
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
  assert.match(html, /<a class="lcv-view" href="\/digital-me">/);
  assert.doesNotMatch(html, /class="vd-avatar"/);
  assert.doesNotMatch(html, /vd-personal-stage/);
  assert.match(html, /class="lcv-photo"/);
  assert.match(html, /\/profile\/yiping-profile-photo\.png/);
  assert.equal((html.match(/class="lcv-link-icon/g) ?? []).length, 3);
  assert.match(html, /class="lcv-link-icon lcv-link-icon--linkedin"/);
  assert.match(html, /\/brand\/unsw\/unsw-crest\.png/);
  assert.match(html, /\/brand\/wqu\/wqu-logo\.svg/);
  assert.match(html, /\/brand\/quantnet\/quantnet-logo\.png/);
  assert.match(html, /\/brand\/claude\/claude-icon\.png/);
  assert.match(html, /class="lcv-panel lcv-about"/);
  assert.match(html, /class="lcv-cv"/);
  assert.match(html, /class="lcv-panel lcv-edu"/);
  assert.match(html, /class="lcv-panel lcv-dm"/);
  assert.equal((html.match(/class="lcv-exp__card"/g) ?? []).length, 2);
  // Experience cards: Optiver work + the UNSW Research Assistant entry (its
  // CV-backed role, not the retired "UNSW RA" preview label).
  assert.match(html, /Optiver/);
  assert.match(html, /Research Assistant/);
  // The mixed-case "UNSW Sydney" label appears exactly once: inside the
  // canonical identity-rail memberships list (the logo strip and crest use the
  // "UNSW SYDNEY" wordmark instead). It must not leak back into the retired
  // hybrid personal-stage membership block.
  assert.equal((html.match(/UNSW Sydney/g) ?? []).length, 1);
  assert.match(html, /class="lcv-members__item lcv-members__item--unsw">[\s\S]*?UNSW Sydney/);
  assert.match(html, /ECON 3202/);
  assert.match(html, /MATH 2991/);
  assert.match(html, /FINS 3666/);
  assert.match(html, /more courses/);
  assert.doesNotMatch(html, /class="vd-home-optibook-shot"/);
  assert.doesNotMatch(html, /class="vd-home-answer-canvas"/);
  assert.doesNotMatch(html, /class="vd-home-proof-steps"/);
  assert.doesNotMatch(html, /class="vd-home-mini-table"/);
  assert.doesNotMatch(html, /Market Lens/);
  assert.doesNotMatch(html, /Source memory/);
  assert.doesNotMatch(html, /NVDA/);
  assert.doesNotMatch(html, /SPY/);
  assert.doesNotMatch(html, /class="vd-profile-card"/);
  assert.doesNotMatch(html, /class="vd-dossier"/);
  assert.doesNotMatch(html, /class="vd-resume-safe-preview"/);
  assert.doesNotMatch(html, /class="vd-evidence-row"/);
  assert.doesNotMatch(html, /class="vd-home-asset-grid"/);
  assert.doesNotMatch(html, /Python Foundations\.pdf/);
  assert.doesNotMatch(html, /Claude Certificate\.html/);
  assert.doesNotMatch(html, /Open Sources/);
  assert.doesNotMatch(html, /vd-personal-stage__actions/);
  assert.doesNotMatch(html, /vd-personal-stage__memberships/);
  assert.doesNotMatch(html, /vd-personal-stage__actions/);
  assert.doesNotMatch(html, /vd-personal-stage__memberships/);
  assert.doesNotMatch(html, /id="cited-answer"/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(html, /vd-loom-intro-link/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /vd-home-source-preview/);
  assert.doesNotMatch(html, /vd-home-route-rail/);
  assert.doesNotMatch(html, /vd-home-provenance/);
  assert.doesNotMatch(html, /aria-label="Loom history"/);
  assert.doesNotMatch(html, /Built with Loom/);
  assert.doesNotMatch(html, /Loom trust layer/);
  assert.doesNotMatch(html, /Loom is the underlying trust mechanism/);
  assert.doesNotMatch(html, /real sources become drafts/);
  assert.doesNotMatch(html, /Concavity and optimisation summary\.md/);
  assert.doesNotMatch(html, />Evidence Portal</);
  assert.doesNotMatch(html, />Explore the source-backed systems/);
  assert.doesNotMatch(html, />Profile \/ CV source</);
  assert.doesNotMatch(html, />Open Digital Me/);
  assert.doesNotMatch(html, />Live system</);
  assert.doesNotMatch(html, /Sources → Reasoning → Artifact/);
  // The Digital Me preview renders the concavity prompt and the member/footer
  // lines are part of the ledger cover, so they are expected to be present.
  assert.match(html, /How does concavity connect to optimisation/);
  assert.match(html, /class="lcv-member">MEMBER SINCE APRIL 2024/);
  assert.match(html, /LOOM — PERSONAL KNOWLEDGE, BACKED BY REAL SOURCES/);
  // The retired source-file row labels must still not leak onto the home cover.
  assert.doesNotMatch(html, /Problem Set 02\.pdf/);
  assert.doesNotMatch(html, /W8 A Concave-Functions\.pdf/);

  for (const label of ['Home', 'About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }

  for (const retiredPrimaryNav of ['UNSW', 'Quantnet', 'WQU', 'Claude']) {
    assert.doesNotMatch(primaryNavHtml, new RegExp(`>${retiredPrimaryNav}<`));
  }

  assert.doesNotMatch(html, /Verified source workspace/);
  assert.doesNotMatch(html, /Sources become cited work/);
  for (const retired of [
    /A knowledge profile people can inspect and ask/,
    /Ask this profile/,
    /Recent progress/,
    /Product story/,
    /Process timeline/,
    /Output previews/,
    /Personal knowledge display/,
    /personal knowledge display platform/i,
    /Yiping's Loom/,
  ]) {
    assert.doesNotMatch(html, retired);
  }
  assert.doesNotMatch(html, /students, researchers, editors, and anyone/i);
});

test('homepage CSS protects balanced evidence portal layout', () => {
  const css = readRepo('app/globals.css');
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
  assert.match(coverComposition, /min-height:\s*calc\(100vh - 5\.1rem\)/);
  assert.match(portraitCover, /display:\s*grid/);
  assert.doesNotMatch(portraitCover, /grid-template-rows:\s*auto auto auto auto minmax\(0,\s*1fr\)/);
  assert.match(headshot, /position:\s*relative/);
  assert.doesNotMatch(headshot, /inset:\s*0/);
  assert.match(headshot, /width:\s*clamp\(5\.2rem,\s*6\.2vw,\s*7\.4rem\)/);
  assert.match(headshot, /aspect-ratio:\s*0\.78/);
  assert.match(headshot, /object-fit:\s*cover/);
  assert.match(headshot, /object-position:\s*center 34%/);
  assert.match(coverLinks, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(coverLink, /justify-content:\s*space-between/);
  assert.match(linkedinIcon, /background:\s*currentColor/);
  assert.match(linkedinIcon, /color:\s*#000/);
  assert.match(proofCovers, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(proofCovers, /grid-template-rows:\s*repeat\(2,\s*minmax\(15rem,\s*1fr\)\)/);
  assert.match(educationVisual, /background:/);
  assert.match(experienceVisual, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(digitalVisual, /display:\s*grid/);
  assert.doesNotMatch(css, /vd-home-asset-grid/);
});

test('repo homepage exposes the personal knowledge identity evidence model', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const primaryNavHtml = html.match(/<div class="lcv-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';

  assert.match(html, /Yiping Yin/);
  assert.match(html, /Quant T\/R/);
  assert.match(html, /AI Founder/);
  assert.match(html, /Digital Me/);
  // The mixed-case "UNSW Sydney" label appears exactly once: only in the
  // canonical identity-rail memberships list, never re-introduced elsewhere.
  assert.equal((html.match(/UNSW Sydney/g) ?? []).length, 1);
  assert.match(html, /class="lcv-members__item lcv-members__item--unsw">[\s\S]*?UNSW Sydney/);
  // The evidence model surfaces four numbered ledger rows: an About CV preview,
  // an Education course/logo strip, two CV-backed Experience cards, and a
  // Digital Me Sources → Draft → Answer flow — each with a verified pill.
  assert.equal((html.match(/class="lcv-row lcv-row--/g) ?? []).length, 4);
  assert.match(html, /class="lcv-cv"/);
  assert.match(html, /ECON 3202/);
  assert.match(html, /class="lcv-edu__logos"/);
  assert.match(html, /more courses/);
  assert.equal((html.match(/class="lcv-exp__card"/g) ?? []).length, 2);
  assert.match(html, /class="lcv-dm__flow"/);
  assert.match(html, /class="lcv-dm__table"/);
  assert.match(html, /class="lcv-dm__graph"/);
  assert.match(html, /How does concavity connect to optimisation/);
  assert.equal((html.match(/class="lcv-verified"/g) ?? []).length, 6);
  assert.doesNotMatch(html, /class="vd-home-optibook-shot"/);
  assert.doesNotMatch(html, /class="vd-home-answer-canvas"/);
  assert.doesNotMatch(html, /class="vd-home-proof-steps"/);
  assert.doesNotMatch(html, /class="vd-home-mini-table"/);
  assert.doesNotMatch(html, /Market Lens/);
  assert.doesNotMatch(html, /Source memory/);
  assert.doesNotMatch(html, /NVDA/);
  assert.doesNotMatch(html, /SPY/);
  assert.doesNotMatch(html, /vd-hero-link/);
  assert.doesNotMatch(html, /Cited output/);
  assert.doesNotMatch(html, /Knowledge identity/);
  assert.doesNotMatch(html, /Real-file workflow/);
  assert.doesNotMatch(html, /Built with Loom/);
  assert.doesNotMatch(html, /Loom trust layer/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /id="cited-answer"/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  for (const label of ['Home', 'About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }
  for (const retiredPrimaryNav of ['UNSW', 'Quantnet', 'WQU', 'Claude']) {
    assert.doesNotMatch(primaryNavHtml, new RegExp(`>${retiredPrimaryNav}<`));
  }
  for (const model of ['Overview', 'Path', 'Sources', 'Process', 'Outputs']) {
    assert.ok(PERSONAL_PLATFORM_MODEL.includes(model as (typeof PERSONAL_PLATFORM_MODEL)[number]));
  }
  assert.doesNotMatch(html, /Sources become cited work/);
  assert.doesNotMatch(html, /Verified source workspace/);
  assert.doesNotMatch(html, /personal knowledge display platform/i);
  assert.doesNotMatch(html, /students, researchers, editors, and anyone/i);
  assert.doesNotMatch(html, /AI Engineer|Citadel/i);
});

test('Sources and Draft remain canonical across web and native shell copy', () => {
  const productShell = readRepo('lib/new-loom/product-shell.ts');
  const nativeShell = readRepo('macos-app/Loom/Sources/LoomMinimalRootView.swift');

  assert.match(productShell, /Sources/);
  assert.match(productShell, /Draft/);
  assert.match(productShell, /learning/i);
  assert.match(productShell, /portfolio/i);
  assert.match(productShell, /process/i);

  assert.match(nativeShell, /Sources/);
  assert.match(nativeShell, /pageDraft/);

  assert.match(productShell, /Overview|Path|Outputs/);
  assert.doesNotMatch(productShell, /Collect, organize, draft/);
});
