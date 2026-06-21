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
  education: [
    {
      institution: 'University of Sydney',
      qualification: 'Bachelor of Science',
      field: 'Computer Science',
      start: '2020',
      end: '2024',
    },
    {
      institution: 'WorldQuant University',
      qualification: 'MSc Financial Engineering',
      start: '2024',
    },
  ],
  experience: [],
  works: [],
};

test('EducationProfileView renders institution names and qualifications', () => {
  const { EducationProfileView } = require('../app/education/page') as typeof import('../app/education/page');
  const html = render(<EducationProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /University of Sydney/);
  assert.match(text, /Bachelor of Science/);
  assert.match(text, /WorldQuant University/);
  assert.match(text, /MSc Financial Engineering/);
});

test('EducationProfileView renders optional field and date range', () => {
  const { EducationProfileView } = require('../app/education/page') as typeof import('../app/education/page');
  const html = render(<EducationProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Computer Science/);
  assert.match(text, /2020/);
  assert.match(text, /2024/);
});

test('EducationProfileView omits evidence strips and FileBadge markers', () => {
  const { EducationProfileView } = require('../app/education/page') as typeof import('../app/education/page');
  const html = render(<EducationProfileView profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.doesNotMatch(text, /Evidence files/);
  assert.doesNotMatch(text, /UNSW courses/);
  assert.doesNotMatch(html, /vd-file-badge/);
  assert.doesNotMatch(html, /FileBadge/);
  assert.doesNotMatch(html, /vd-section-page__artifact-strip/);
  assert.doesNotMatch(html, /vd-section-page__course-strip/);
});

test('EducationProfileView uses the vd-section-page shell and grid', () => {
  const { EducationProfileView } = require('../app/education/page') as typeof import('../app/education/page');
  const html = render(<EducationProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /class="vd-section-page"/);
  assert.match(html, /aria-labelledby="education-title"/);
  assert.match(html, /id="education-title"/);
  assert.match(html, /class="vd-section-page__grid"/);
  assert.match(html, /class="vd-section-page__band-label"/);
  assert.match(html, /Institutions/);
});

test('EducationProfileView renders initials badges for both entries', () => {
  const { EducationProfileView } = require('../app/education/page') as typeof import('../app/education/page');
  const html = render(<EducationProfileView profile={SAMPLE_PROFILE} />);

  // Initials for "University of Sydney" → "UOS"
  assert.match(html, /UOS/);
  // Initials for "WorldQuant University" → "WU"
  assert.match(html, /WU/);
});

test('EducationProfileView renders gracefully with zero entries', () => {
  const { EducationProfileView } = require('../app/education/page') as typeof import('../app/education/page');
  const emptyProfile: BeginnerProfile = { ...SAMPLE_PROFILE, education: [] };
  const html = render(<EducationProfileView profile={emptyProfile} />);

  // Should not throw; should still render the shell
  assert.match(html, /class="vd-section-page"/);
  assert.match(html, /Institutions/);
});

test('EducationProfileView includes the beginner section cross-nav with /works, /digital-me, /card', () => {
  const { EducationProfileView } = require('../app/education/page') as typeof import('../app/education/page');
  const html = render(<EducationProfileView profile={SAMPLE_PROFILE} />);

  assert.match(html, /home-profile-section-nav/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="\/experience"/);
  assert.match(html, /href="\/works"/);
  assert.match(html, /href="\/digital-me"/);
  assert.match(html, /href="\/card"/);
});
