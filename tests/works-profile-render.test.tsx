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
  home: { name: 'Test User', headline: 'Test Headline' },
  about: { summary: 'A test summary.', links: [] },
  education: [],
  experience: [],
  works: [
    {
      title: 'Option Pricer',
      description: 'Black-Scholes web calculator built in TypeScript.',
      link: 'https://github.com/ada/option-pricer',
      role: 'Solo developer',
      date: '2024',
    },
    {
      title: 'Atlas',
      description: 'Personal knowledge graph.',
    },
  ],
};

test('WorksProfileView renders title and description', () => {
  const { WorksProfileView } = require('../app/works/page') as typeof import('../app/works/page');
  const html = render(<WorksProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Option Pricer/);
  assert.match(text, /Black-Scholes web calculator/);
  assert.match(text, /Atlas/);
  assert.match(text, /Personal knowledge graph/);
});

test('WorksProfileView renders link as anchor when link is present', () => {
  const { WorksProfileView } = require('../app/works/page') as typeof import('../app/works/page');
  const html = render(<WorksProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /href="https:\/\/github\.com\/ada\/option-pricer"/);
});

test('WorksProfileView renders role and date when present', () => {
  const { WorksProfileView } = require('../app/works/page') as typeof import('../app/works/page');
  const html = render(<WorksProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Solo developer/);
  assert.match(text, /2024/);
});

test('WorksProfileView uses the vd-section-page shell', () => {
  const { WorksProfileView } = require('../app/works/page') as typeof import('../app/works/page');
  const html = render(<WorksProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /vd-section-page/);
  assert.match(html, /aria-labelledby="works-title"/);
  assert.match(html, /id="works-title"/);
  assert.match(html, /class="vd-section-page__list"/);
  assert.match(html, /class="vd-section-page__band-label"/);
  assert.match(html, /Projects/);
});

test('WorksProfileView renders gracefully with zero entries', () => {
  const { WorksProfileView } = require('../app/works/page') as typeof import('../app/works/page');
  const emptyProfile: BeginnerProfile = { ...SAMPLE_PROFILE, works: [] };
  const html = render(<WorksProfileView profile={emptyProfile} />);

  assert.match(html, /vd-section-page/);
  assert.match(html, /Projects/);
  assert.doesNotMatch(html, /Option Pricer/);
});

test('WorksProfileView includes the beginner section cross-nav with /works, /digital-me, /card', () => {
  const { WorksProfileView } = require('../app/works/page') as typeof import('../app/works/page');
  const html = render(<WorksProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /home-profile-section-nav/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="\/education"/);
  assert.match(html, /href="\/experience"/);
  assert.match(html, /href="\/works"/);
  assert.match(html, /href="\/digital-me"/);
  assert.match(html, /href="\/card"/);
});

test('WorksOwnerEmptyView renders an explicit empty-state, not the "0 projects" shell', () => {
  const { WorksOwnerEmptyView } = require('../app/works/page') as typeof import('../app/works/page');
  const html = render(<WorksOwnerEmptyView />);
  const text = visibleText(html);

  // Must NOT claim "0 projects on record." (the misleading beginner shell).
  assert.doesNotMatch(text, /0 projects on record/);
  // Must explain there is no works surface and point back to dossier sections.
  assert.match(text, /No works surface here/);
  assert.match(html, /href="\/experience"/);
  assert.match(html, /id="works-title"/);
  assert.match(html, /vd-section-page/);
});

test('WorksProfileView shows entries when works exist and omits them when empty', () => {
  const { WorksProfileView } = require('../app/works/page') as typeof import('../app/works/page');

  // Non-empty: work titles present
  const htmlFull = render(<WorksProfileView profile={SAMPLE_PROFILE} />);
  assert.match(htmlFull, /Option Pricer/);

  // Empty: no work titles
  const htmlEmpty = render(<WorksProfileView profile={{ ...SAMPLE_PROFILE, works: [] }} />);
  assert.doesNotMatch(htmlEmpty, /Option Pricer/);
  assert.doesNotMatch(htmlEmpty, /Atlas/);
});
