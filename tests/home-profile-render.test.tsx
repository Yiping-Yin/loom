import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { type BeginnerProfile } from '../lib/profile/beginner-profile';

const cssModuleClassMap = new Proxy(
  {},
  { get: (_target, className) => (typeof className === 'string' ? className : '') },
) as Record<string, string>;
const cssModuleExports = { __esModule: true, default: cssModuleClassMap };

require.extensions['.css'] = (module: { exports: typeof cssModuleExports }) => {
  module.exports = cssModuleExports;
};

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  return renderToStaticMarkup(node);
}

function visibleText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
}

const SAMPLE_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Jane Doe', headline: 'Quantitative Researcher' },
  about: {
    summary: 'Building knowledge systems at the intersection of finance and AI.',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/janedoe' },
    ],
  },
  education: [],
  experience: [],
  works: [],
};

test('HomeProfileView renders name and headline', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const html = render(<HomeProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Jane Doe/);
  assert.match(text, /Quantitative Researcher/);
});

test('HomeProfileView renders summary when present', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const html = render(<HomeProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Building knowledge systems at the intersection of finance and AI\./);
});

test('HomeProfileView renders section nav links to /about, /education, /experience, /works, /digital-me, /card', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const html = render(<HomeProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /href="\/about"/);
  assert.match(html, /href="\/education"/);
  assert.match(html, /href="\/experience"/);
  assert.match(html, /href="\/works"/);
  assert.match(html, /href="\/digital-me"/);
  assert.match(html, /href="\/card"/);
});

test('HomeProfileView renders NEW_LOOM_CAPABILITIES capability links', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const html = render(<HomeProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // Sources and Draft are the two capabilities defined in product-shell.ts
  assert.match(text, /Sources/);
  assert.match(text, /Draft/);
  assert.match(html, /data-capability="sources"/);
  assert.match(html, /data-capability="draft"/);
  assert.match(html, /new-loom-home-capabilities/);
});

test('HomeProfileView omits VerifiedDossierHome (no dossier markers)', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const html = render(<HomeProfileView profile={SAMPLE_PROFILE} />);

  // Unique identifiers from VerifiedDossierHome
  assert.doesNotMatch(html, /lcv-cv/);
  assert.doesNotMatch(html, /lcv-panel/);
  assert.doesNotMatch(html, /lcv-verified/);
  assert.doesNotMatch(html, /CURRICULUM VITAE/);
  assert.doesNotMatch(html, /YIPING YIN/);
});

test('HomeProfileView falls back to "Your name" when name is empty', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const emptyNameProfile: BeginnerProfile = {
    ...SAMPLE_PROFILE,
    home: { name: '', headline: '' },
  };
  const html = render(<HomeProfileView profile={emptyNameProfile} />);
  const text = visibleText(html);

  assert.match(text, /Your name/);
});

test('HomeProfileView omits summary block when summary is empty', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const noSummaryProfile: BeginnerProfile = {
    ...SAMPLE_PROFILE,
    about: { summary: '', links: [] },
  };
  const html = render(<HomeProfileView profile={noSummaryProfile} />);

  assert.doesNotMatch(html, /home-profile-summary/);
});

test('HomeProfileView has aria-labelledby pointing to home-profile-title', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const html = render(<HomeProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /aria-labelledby="home-profile-title"/);
  assert.match(html, /id="home-profile-title"/);
});

test('HomeProfileView renders loom-cosmic-field', () => {
  const { HomeProfileView } = require('../app/HomeProfileView') as typeof import('../app/HomeProfileView');
  const html = render(<HomeProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /loom-cosmic-field/);
});
