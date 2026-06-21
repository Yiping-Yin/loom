/**
 * Contract tests for BeginnerJourney: milestone construction, ordering,
 * type tags, and conditional rendering in BeginnerDigitalMe.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { type BeginnerProfile } from '../lib/profile/beginner-profile';

// CSS Modules: return a proxy so any className lookup is a no-op string.
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
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---- Fixtures ------------------------------------------------------------------

const FULL_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Alex Chen', headline: 'Software Engineer' },
  about: { summary: 'Building things.', links: [] },
  education: [
    {
      institution: 'MIT',
      qualification: 'BSc',
      field: 'Computer Science',
      start: '2018',
      end: '2022',
    },
  ],
  experience: [
    {
      role: 'Backend Engineer',
      organization: 'Acme Corp',
      start: '2022',
      end: '2024',
      bullets: [],
    },
  ],
  works: [
    {
      title: 'Open Source CLI',
      description: 'A command-line tool.',
      date: '2023',
    },
  ],
};

const EXP_ONLY_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Sam', headline: '' },
  about: { summary: '', links: [] },
  education: [],
  experience: [
    {
      role: 'Product Manager',
      organization: 'StartupXYZ',
      start: '2020',
      end: '2023',
      bullets: [],
    },
  ],
  works: [],
};

const EMPTY_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: '', headline: '' },
  about: { summary: '', links: [] },
  education: [],
  experience: [],
  works: [],
};

// ---- BeginnerJourney unit tests ------------------------------------------------

test('BeginnerJourney renders milestones from all three sections', () => {
  const { BeginnerJourney } = require('../app/digital-me/BeginnerJourney') as typeof import('../app/digital-me/BeginnerJourney');
  const html = render(<BeginnerJourney profile={FULL_PROFILE} />);
  const text = visibleText(html);

  // All three entries are present
  assert.match(text, /BSc/);
  assert.match(text, /MIT/);
  assert.match(text, /Backend Engineer/);
  assert.match(text, /Acme Corp/);
  assert.match(text, /Open Source CLI/);
});

test('BeginnerJourney renders exactly 3 milestones for a profile with one entry per section', () => {
  const { BeginnerJourney } = require('../app/digital-me/BeginnerJourney') as typeof import('../app/digital-me/BeginnerJourney');
  const html = render(<BeginnerJourney profile={FULL_PROFILE} />);

  // Each milestone is an <li> element
  const liMatches = html.match(/<li /g) ?? [];
  assert.equal(liMatches.length, 3);
});

test('BeginnerJourney renders type tags for each entry type', () => {
  const { BeginnerJourney } = require('../app/digital-me/BeginnerJourney') as typeof import('../app/digital-me/BeginnerJourney');
  const html = render(<BeginnerJourney profile={FULL_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Education/);
  assert.match(text, /Experience/);
  assert.match(text, /Work/);
});

test('BeginnerJourney orders milestones oldest-first by parseable year', () => {
  const { BeginnerJourney } = require('../app/digital-me/BeginnerJourney') as typeof import('../app/digital-me/BeginnerJourney');
  // Education starts 2018, experience starts 2022, work 2023 → chronological order
  const html = render(<BeginnerJourney profile={FULL_PROFILE} />);
  const eduPos = html.indexOf('MIT');
  const expPos = html.indexOf('Acme Corp');
  const workPos = html.indexOf('Open Source CLI');

  assert.ok(eduPos < expPos, 'Education (2018) should precede Experience (2022)');
  assert.ok(expPos < workPos, 'Experience (2022) should precede Work (2023)');
});

test('BeginnerJourney renders correctly with only experience', () => {
  const { BeginnerJourney } = require('../app/digital-me/BeginnerJourney') as typeof import('../app/digital-me/BeginnerJourney');
  const html = render(<BeginnerJourney profile={EXP_ONLY_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Product Manager/);
  assert.match(text, /StartupXYZ/);

  // Only one milestone item
  const liMatches = html.match(/<li /g) ?? [];
  assert.equal(liMatches.length, 1);

  // The single item's type tag should be "Experience"; no Education or Work tags
  // (the section heading "Experience & Education" is fixed text and does contain
  // "Education", so we assert on data-type attributes instead of visible text)
  assert.match(html, /data-type="experience"/);
  assert.doesNotMatch(html, /data-type="education"/);
  assert.doesNotMatch(html, /data-type="work"/);
});

test('BeginnerJourney renders null for an empty profile', () => {
  const { BeginnerJourney } = require('../app/digital-me/BeginnerJourney') as typeof import('../app/digital-me/BeginnerJourney');
  const html = render(<BeginnerJourney profile={EMPTY_PROFILE} />);

  // Component returns null → renders nothing
  assert.equal(html.trim(), '');
});

test('BeginnerJourney undated items appear after dated items', () => {
  const { BeginnerJourney } = require('../app/digital-me/BeginnerJourney') as typeof import('../app/digital-me/BeginnerJourney');
  const profileWithUndated: BeginnerProfile = {
    ...FULL_PROFILE,
    works: [
      { title: 'No Date Project', description: 'No date at all.' },
      { title: 'Dated Project', date: '2021' },
    ],
  };
  const html = render(<BeginnerJourney profile={profileWithUndated} />);

  const datedPos = html.indexOf('Dated Project');
  const undatedPos = html.indexOf('No Date Project');

  assert.ok(datedPos < undatedPos, 'Dated project (2021) should appear before undated project');
});

// ---- BeginnerDigitalMe integration tests ---------------------------------------

test('BeginnerDigitalMe renders BeginnerJourney when profile has data', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={FULL_PROFILE} />);
  const text = visibleText(html);

  // Journey section heading must appear
  assert.match(text, /Experience.*Education|Education.*Experience/);
  // Timeline items
  assert.match(text, /MIT/);
  assert.match(text, /Acme Corp/);
});

test('BeginnerDigitalMe omits the journey section for an empty profile', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={EMPTY_PROFILE} />);
  const text = visibleText(html);

  // No journey section heading
  assert.doesNotMatch(text, /beginner-journey-heading/);
  // No timeline items
  assert.doesNotMatch(html, /<ol/);
});
