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
const privateWikiRoot = path.resolve(repoRoot, '..');

function readRepo(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readPrivateWiki(relativePath: string) {
  return fs.readFileSync(path.join(privateWikiRoot, relativePath), 'utf8');
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

  assert.match(html, /A knowledge profile people can inspect and ask\./);
  assert.match(
    html,
    /Sources, drafts, projects, and conversations become a public record/,
  );
  assert.match(html, /ECON3202 Problem Set 2\.pdf/);
  assert.match(html, /Lecture 8 Slides\.pptx/);
  assert.match(html, /Sources to Draft to Answer/);
  assert.match(html, /Ask this profile/);
  assert.match(html, /Phillips Curve/);
  assert.match(html, /aria-label="Loom history"/);

  for (const label of [
    'About',
    'UNSW',
    'Quantnet',
    'WQU',
    'Claude',
    'Original Loom',
    'Private Wiki',
    'Knowledge identity',
    'Platform for everyone',
    'Sources',
    'Draft',
  ]) {
    assert.match(html, new RegExp(label));
  }

  for (const retired of [
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

test('static Private Wiki home exposes the personal knowledge identity model', () => {
  const html = readPrivateWiki('index.html');

  assert.match(html, /Loom is a personal knowledge identity platform/i);
  assert.match(html, /a portfolio people can inspect/i);
  assert.match(html, /personal knowledge identity layer/i);
  for (const label of ['About', 'UNSW', 'Quantnet', 'WQU', 'Claude']) {
    assert.match(html, new RegExp(`>${label}<|${label}`));
  }
  for (const model of ['Overview', 'Path', 'Sources', 'Process', 'Outputs']) {
    assert.match(html, new RegExp(model));
  }
  assert.match(html, /thinking loom/i);
  assert.match(html, /ECON3202/);
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
