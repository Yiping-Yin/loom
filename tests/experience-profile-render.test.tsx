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
  experience: [
    {
      role: 'Quantitative Analyst',
      organization: 'Optiver',
      start: '2023',
      end: '2024',
      location: 'Sydney',
      bullets: ['Developed pricing models.', 'Reduced latency by 30%.'],
    },
    {
      role: 'Software Engineer',
      organization: 'Gumtree',
      start: '2022',
      bullets: ['Built ML-powered listing assistant.'],
    },
  ],
  works: [],
};

test('ExperienceProfileView renders role and organization names', () => {
  const { ExperienceProfileView } = require('../app/experience/page') as typeof import('../app/experience/page');
  const html = render(<ExperienceProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Quantitative Analyst/);
  assert.match(text, /Optiver/);
  assert.match(text, /Software Engineer/);
  assert.match(text, /Gumtree/);
});

test('ExperienceProfileView renders date range and location', () => {
  const { ExperienceProfileView } = require('../app/experience/page') as typeof import('../app/experience/page');
  const html = render(<ExperienceProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /2023/);
  assert.match(text, /2024/);
  assert.match(text, /Sydney/);
});

test('ExperienceProfileView renders bullets as list items', () => {
  const { ExperienceProfileView } = require('../app/experience/page') as typeof import('../app/experience/page');
  const html = render(<ExperienceProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Developed pricing models\./);
  assert.match(text, /Reduced latency by 30%\./);
  assert.match(text, /Built ML-powered listing assistant\./);
});

test('ExperienceProfileView omits FileBadge and evidence markers', () => {
  const { ExperienceProfileView } = require('../app/experience/page') as typeof import('../app/experience/page');
  const html = render(<ExperienceProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.doesNotMatch(text, /Evidence/);
  assert.doesNotMatch(html, /vd-file-badge/);
  assert.doesNotMatch(html, /FileBadge/);
  assert.doesNotMatch(html, /vd-section-page__artifact-strip/);
  assert.doesNotMatch(html, /vd-section-page__course-strip/);
});

test('ExperienceProfileView uses the vd-section-page shell', () => {
  const { ExperienceProfileView } = require('../app/experience/page') as typeof import('../app/experience/page');
  const html = render(<ExperienceProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /vd-section-page/);
  assert.match(html, /aria-labelledby="experience-title"/);
  assert.match(html, /id="experience-title"/);
  assert.match(html, /class="vd-section-page__list"/);
  assert.match(html, /class="vd-section-page__band-label"/);
  assert.match(html, /Roles/);
});

test('ExperienceProfileView renders gracefully with zero entries', () => {
  const { ExperienceProfileView } = require('../app/experience/page') as typeof import('../app/experience/page');
  const emptyProfile: BeginnerProfile = { ...SAMPLE_PROFILE, experience: [] };
  const html = render(<ExperienceProfileView profile={emptyProfile} />);

  // Should not throw; should still render the shell
  assert.match(html, /vd-section-page/);
  assert.match(html, /Roles/);
});

test('ExperienceProfileView includes the beginner section cross-nav with /works', () => {
  const { ExperienceProfileView } = require('../app/experience/page') as typeof import('../app/experience/page');
  const html = render(<ExperienceProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /home-profile-section-nav/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="\/education"/);
  assert.match(html, /href="\/works"/);
});
