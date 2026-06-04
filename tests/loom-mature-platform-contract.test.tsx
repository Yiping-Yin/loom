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

function cssBlock(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `${selector} block should exist`);

  const openBrace = css.indexOf('{', start);
  let depth = 0;
  for (let index = openBrace; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, index + 1);
    }
  }

  assert.fail(`${selector} block should close`);
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
  const primaryNavHtml = html.match(/<div class="vd-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';

  assert.match(html, /Yiping Yin/);
  assert.match(html, /Student · Builder · Learner · Sydney, Australia/);
  assert.match(html, /class="vd-personal-stage"/);
  assert.match(html, /role="img" aria-label="Profile source"/);
  assert.match(html, /role="img" aria-label="Course shelves"/);
  assert.match(html, /role="img" aria-label="Project proof"/);
  assert.match(html, /role="img" aria-label="Answer canvas"/);
  assert.match(html, /<h2>About<\/h2><span>Profile<\/span>/);
  assert.match(html, /<h2>Education<\/h2><span>Course record<\/span>/);
  assert.match(html, /<h2>Experience<\/h2><span>Project evidence<\/span>/);
  assert.match(html, /<h2>Digital Me<\/h2><span>Answer canvas<\/span>/);
  assert.doesNotMatch(html, /id="cited-answer"/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  assert.doesNotMatch(html, /vd-loom-intro-link/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-workbench-grid/);
  assert.doesNotMatch(html, /aria-label="Loom history"/);
  assert.doesNotMatch(html, /Problem Set 02\.pdf \/ W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(html, /Built with Loom/);
  assert.doesNotMatch(html, /Loom trust layer/);
  assert.doesNotMatch(html, /Loom is the underlying trust mechanism/);
  assert.doesNotMatch(html, /real sources become drafts/);
  assert.doesNotMatch(html, /Problem Set 02\.pdf/);
  assert.doesNotMatch(html, /W8 A Concave-Functions\.pdf/);
  assert.doesNotMatch(html, /Concavity and optimisation summary\.md/);
  assert.doesNotMatch(html, /Sources[\s\S]{0,80}Draft[\s\S]{0,80}Answer/);

  for (const label of ['About', 'Education', 'Experience', 'Digital Me']) {
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

test('homepage CSS protects picture-first personal category cards', () => {
  const css = readRepo('app/globals.css');
  const categoryVisual = cssBlock(css, '.vd-category-visual');
  const categoryMedia = cssBlock(css, '.vd-category-visual__media');
  const categoryMediaImage = cssBlock(css, '.vd-category-visual__media img');
  const categoryBody = cssBlock(css, '.vd-personal-category-card__body');

  assert.match(categoryVisual, /aspect-ratio:\s*1\.48/);
  assert.doesNotMatch(categoryVisual, /grid-template-rows/);
  assert.match(categoryVisual, /overflow:\s*hidden/);
  assert.match(categoryMedia, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(categoryMedia, /overflow:\s*hidden/);
  assert.match(categoryMedia, /height:\s*100%/);
  assert.match(categoryMediaImage, /object-fit:\s*cover/);
  assert.match(categoryBody, /grid-template-rows:\s*auto\s+auto/);
});

test('repo homepage exposes the personal knowledge identity evidence model', () => {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };

  const html = renderToStaticMarkup(<HomeClient />);
  const primaryNavHtml = html.match(/<div class="vd-nav__links">[\s\S]*?<\/div>/)?.[0] ?? '';

  assert.match(html, /Yiping Yin/);
  assert.match(html, /Student · Builder · Learner · Sydney, Australia/);
  assert.match(html, /Digital Me/);
  assert.match(html, /Profile/);
  assert.match(html, /Course record/);
  assert.match(html, /Project evidence/);
  assert.match(html, /Answer canvas/);
  assert.doesNotMatch(html, /Sources[\s\S]*Draft[\s\S]*Digital Me/);
  assert.doesNotMatch(html, /Cited output/);
  assert.doesNotMatch(html, /Knowledge identity/);
  assert.doesNotMatch(html, /Real-file workflow/);
  assert.doesNotMatch(html, /Built with Loom/);
  assert.doesNotMatch(html, /Loom trust layer/);
  assert.doesNotMatch(html, /vd-proof-band/);
  assert.doesNotMatch(html, /vd-loom-intro/);
  assert.doesNotMatch(html, /id="cited-answer"/);
  assert.doesNotMatch(html, /aria-label="Identity sidebar"/);
  for (const label of ['About', 'Education', 'Experience', 'Digital Me']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }
  for (const retiredPrimaryNav of ['UNSW', 'Quantnet', 'WQU', 'Claude']) {
    assert.doesNotMatch(primaryNavHtml, new RegExp(`>${retiredPrimaryNav}<`));
  }
  for (const model of ['Overview', 'Path', 'Sources', 'Process', 'Outputs']) {
    assert.ok(PERSONAL_PLATFORM_MODEL.includes(model as (typeof PERSONAL_PLATFORM_MODEL)[number]));
  }
  assert.doesNotMatch(html, /ECON 3202/);
  assert.doesNotMatch(html, /FINS 3666/);
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
