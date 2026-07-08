import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';

import { VERIFIED_DOSSIER_HOME_COPY } from '../lib/new-loom/verified-dossier-home';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

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

function renderHomeClientHtml() {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  const { HomeClient } = require('../app/HomeClient') as typeof import('../app/HomeClient');

  return renderToStaticMarkup(<HomeClient />);
}

function globalNavHtml(html: string, ariaLabel = 'Verified dossier navigation') {
  return html.match(new RegExp(`<nav[^>]+aria-label="${ariaLabel}"[\\s\\S]*?<\\/nav>`))?.[0] ?? '';
}

test('home first paint frames Loom as an inspectable personal knowledge identity', () => {
  const html = renderHomeClientHtml();
  const primaryNavHtml = globalNavHtml(html);

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
  assert.equal((html.match(/class="lcv-row lcv-row--/g) ?? []).length, 3);
  assert.match(html, /class="lcv-row lcv-row--about"/);
  assert.match(html, /class="lcv-row lcv-row--education"/);
  assert.match(html, /class="lcv-row lcv-row--experience"/);
  assert.equal((html.match(/class="lcv-row__num"/g) ?? []).length, 3);
  // The whole row is the link to its category — no separate "View details" element.
  assert.doesNotMatch(html, /class="lcv-view"/);
  assert.equal((html.match(/<a class="lcv-row lcv-row--[a-z-]+" href="/g) ?? []).length, 3);
  assert.match(html, /<a class="lcv-row lcv-row--about" href="\/about"/);
  assert.match(html, /<a class="lcv-row lcv-row--education" href="\/education"/);
  assert.match(html, /<a class="lcv-row lcv-row--experience" href="\/experience"/);
  assert.equal((html.match(/class="lcv-verified"/g) ?? []).length, 5);
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

  for (const label of ['Home', 'About', 'Education', 'Experience']) {
    assert.match(primaryNavHtml, new RegExp(`>${label}<`));
  }
  for (const menuLabel of ['Identity', 'Workspaces', 'Sources']) {
    assert.match(primaryNavHtml, new RegExp(`>${menuLabel}<`));
  }
  assert.match(primaryNavHtml, /href="\/sources"/);
  // Draft is no longer a peer workspace nav item — it lives inside Digital Me.
  assert.doesNotMatch(primaryNavHtml, /href="\/draft"/);
  assert.doesNotMatch(primaryNavHtml, /href="\/drafts"/);

  for (const label of [
    'About',
    'Education',
    'Experience',
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

// Removed: 'personal positioning CSS keeps the Home cover visual and non-operational'
// — it pinned the retired .vd-home--cover cover CSS, removed as dead code (no
// component applies that class). The rendered-HTML guard that the dead class is never
// emitted remains in home-client-first-paint.

test('Sources Studio and Digital Me descriptions serve learning paths, resources, portfolio, and process work', () => {
  const productShell = read('lib/new-loom/product-shell.ts');

  assert.match(productShell, /learning paths/i);
  assert.match(productShell, /resources/i);
  assert.doesNotMatch(productShell, /one workspace/i);
});

// (The support-surfaces positioning contract retired with the web support
// pages — web-retirement 5/7, 2026-07-08.)

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
  const productDefinition = read('docs/canon/LOOM.md');
  const productRules = read('docs/canon/LOOM_RULES.md');
  const appStoreCopy = read('docs/app-store-copy.md');
  const canonicalDocs = [readme, productDefinition, productRules].join('\n');

  assert.match(readme, /local context-to-form workspace/i);
  assert.match(readme, /Studio documents/i);
  assert.match(readme, /Digital Me/i);
  assert.match(productDefinition, /local[\s>]+context-to-form workspace/i);
  assert.match(productDefinition, /source-backed forms/i);
  assert.match(productDefinition, /Yiping's Loom is[\s>]+the first reference instance/i);
  assert.match(productRules, /local context-to-form workspace/i);
  assert.match(productRules, /Digital Me that answers from the real archive/i);
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
