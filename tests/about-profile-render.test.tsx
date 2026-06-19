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
      { label: 'GitHub', href: 'https://github.com/janedoe' },
    ],
  },
  education: [],
  experience: [],
  works: [],
};

test('AboutProfileView renders name and summary', () => {
  const { AboutProfileView } = require('../app/about/AboutProfileView') as typeof import('../app/about/AboutProfileView');
  const html = render(<AboutProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Jane Doe/);
  assert.match(text, /Building knowledge systems at the intersection of finance and AI\./);
});

test('AboutProfileView renders profile link labels', () => {
  const { AboutProfileView } = require('../app/about/AboutProfileView') as typeof import('../app/about/AboutProfileView');
  const html = render(<AboutProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /LinkedIn/);
  assert.match(text, /GitHub/);
});

test('AboutProfileView profile links have target=_blank and rel=noreferrer', () => {
  const { AboutProfileView } = require('../app/about/AboutProfileView') as typeof import('../app/about/AboutProfileView');
  const html = render(<AboutProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noreferrer"/);
});

test('AboutProfileView omits evidence, CV, Profile map markers', () => {
  const { AboutProfileView } = require('../app/about/AboutProfileView') as typeof import('../app/about/AboutProfileView');
  const html = render(<AboutProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.doesNotMatch(text, /FileBadge/);
  assert.doesNotMatch(text, /Source.backed claims/);
  assert.doesNotMatch(text, /Curriculum Vitae/);
  assert.doesNotMatch(text, /Profile map/);
  assert.doesNotMatch(html, /vd-file-badge/);
  assert.doesNotMatch(html, /resumePanel/);
  assert.doesNotMatch(html, /sourceRail/);
  assert.doesNotMatch(html, /activityGrid/);
});

test('AboutProfileView renders with the about page shell and nav', () => {
  const { AboutProfileView } = require('../app/about/AboutProfileView') as typeof import('../app/about/AboutProfileView');
  const html = render(<AboutProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /aria-labelledby="about-title"/);
  assert.match(html, /id="about-title"/);
  assert.match(html, /loom-cosmic-field/);
});

test('AboutProfileView renders initials placeholder instead of photo', () => {
  const { AboutProfileView } = require('../app/about/AboutProfileView') as typeof import('../app/about/AboutProfileView');
  const html = render(<AboutProfileView profile={SAMPLE_PROFILE} />);

  // Initials for "Jane Doe" → "JD"
  assert.match(html, /JD/);
  // No <img> for profile photo
  assert.doesNotMatch(html, /aboutPhotoSrc/);
  assert.doesNotMatch(html, /cv-yiping-yin/);
});

test('AboutProfileView falls back to "Your name" when name is empty', () => {
  const { AboutProfileView } = require('../app/about/AboutProfileView') as typeof import('../app/about/AboutProfileView');
  const emptyNameProfile: BeginnerProfile = {
    ...SAMPLE_PROFILE,
    home: { name: '', headline: '' },
    about: { summary: '', links: [] },
  };
  const html = render(<AboutProfileView profile={emptyNameProfile} />);
  const text = visibleText(html);

  assert.match(text, /Your name/);
});
