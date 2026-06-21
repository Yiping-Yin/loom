import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import { type BeginnerProfile } from '../lib/profile/beginner-profile';
import {
  buildPostcardModel,
  buildStandaloneCardHtml,
} from '../app/card/postcard-markup';

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
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const FULL_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Alex Chen', headline: 'Software Engineer' },
  about: { summary: 'Building reliable distributed systems and learning ML foundations.', links: [] },
  education: [
    { institution: 'UNSW', qualification: 'BSc', field: 'CS', start: '2020', end: '2023' },
  ],
  experience: [
    { role: 'Backend Engineer', organization: 'Acme', start: '2023', end: '2024', bullets: [] },
  ],
  works: [
    { title: 'Realtime Chat', description: 'A websocket chat app.', role: 'Author', date: '2024' },
  ],
};

const SPARSE_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Jordan', headline: 'Curious learner' },
  about: { summary: '', links: [] },
  education: [],
  experience: [],
  works: [],
};

test('DigitalPostcard renders name, headline, and summary', () => {
  const { DigitalPostcard } = require('../app/card/DigitalPostcard') as typeof import('../app/card/DigitalPostcard');
  const html = render(<DigitalPostcard profile={FULL_PROFILE} isOwnCard />);
  const text = visibleText(html);
  assert.match(text, /Alex Chen/);
  assert.match(text, /Software Engineer/);
  assert.match(text, /Building reliable distributed systems/);
});

test('DigitalPostcard renders a stat strip of non-zero counts', () => {
  const { DigitalPostcard } = require('../app/card/DigitalPostcard') as typeof import('../app/card/DigitalPostcard');
  const html = render(<DigitalPostcard profile={FULL_PROFILE} isOwnCard />);
  const text = visibleText(html);
  // 1 work, 1 experience, 1 education — singular labels.
  assert.match(text, /\bWork\b/);
  assert.match(text, /\bExperience\b/);
  assert.match(text, /\bEducation\b/);
});

test('DigitalPostcard renders the footer line', () => {
  const { DigitalPostcard } = require('../app/card/DigitalPostcard') as typeof import('../app/card/DigitalPostcard');
  const html = render(<DigitalPostcard profile={FULL_PROFILE} isOwnCard />);
  const text = visibleText(html);
  assert.match(text, /Verified, cited/);
  assert.match(text, /ask my Digital Me anything/);
});

test('DigitalPostcard uses the realistic-moon brand mark', () => {
  const { DigitalPostcard } = require('../app/card/DigitalPostcard') as typeof import('../app/card/DigitalPostcard');
  const html = render(<DigitalPostcard profile={FULL_PROFILE} isOwnCard />);
  assert.match(html, /\/brand\/loom_lunar_orb\.png/);
});

test('owner card shows Copy + Download actions', () => {
  const { DigitalPostcard } = require('../app/card/DigitalPostcard') as typeof import('../app/card/DigitalPostcard');
  const html = render(<DigitalPostcard profile={FULL_PROFILE} isOwnCard />);
  const text = visibleText(html);
  assert.match(text, /Copy shareable link/);
  assert.match(text, /Download card/);
  // The owner is not shown the visitor "Make your own" link.
  assert.doesNotMatch(text, /Make your own Loom/);
});

test('shared card hides owner actions and shows Make your own', () => {
  const { DigitalPostcard } = require('../app/card/DigitalPostcard') as typeof import('../app/card/DigitalPostcard');
  const html = render(<DigitalPostcard profile={FULL_PROFILE} isOwnCard={false} />);
  const text = visibleText(html);
  assert.doesNotMatch(text, /Copy shareable link/);
  assert.doesNotMatch(text, /Download card/);
  assert.match(text, /Make your own Loom/);
});

test('sparse profile (name + headline only) degrades cleanly', () => {
  const { DigitalPostcard } = require('../app/card/DigitalPostcard') as typeof import('../app/card/DigitalPostcard');
  const html = render(<DigitalPostcard profile={SPARSE_PROFILE} isOwnCard />);
  const text = visibleText(html);
  // Name + headline still present and intentional.
  assert.match(text, /Jordan/);
  assert.match(text, /Curious learner/);
  // No empty stat strip rendered.
  const model = buildPostcardModel(SPARSE_PROFILE);
  assert.equal(model.stats.length, 0);
  assert.equal(model.capabilityHint, '');
  // Footer still anchors the card.
  assert.match(text, /Verified, cited/);
});

test('buildPostcardModel drops zero counts and truncates a long summary', () => {
  const longSummary = 'word '.repeat(120).trim();
  const model = buildPostcardModel({
    ...SPARSE_PROFILE,
    about: { summary: longSummary, links: [] },
  });
  assert.equal(model.stats.length, 0);
  assert.ok(model.summary.length < longSummary.length);
  assert.match(model.summary, /…$/);
});

test('buildPostcardModel surfaces a top-work capability hint', () => {
  const model = buildPostcardModel(FULL_PROFILE);
  assert.match(model.capabilityHint, /Realtime Chat/);
});

test('buildStandaloneCardHtml is self-contained (no external refs) and matches the card', () => {
  const html = buildStandaloneCardHtml(
    FULL_PROFILE,
    'data:image/png;base64,AAAA',
    'https://loom.app/digital-me',
  );
  // A full standalone document.
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /<style>/);
  assert.match(html, /class="loom-postcard"/);
  // Card content is present.
  assert.match(html, /Alex Chen/);
  assert.match(html, /Software Engineer/);
  // The moon is the inlined data URI, not a network path.
  assert.match(html, /data:image\/png;base64,AAAA/);
  // No external link/script/stylesheet references that would break offline.
  assert.doesNotMatch(html, /<link\b/);
  assert.doesNotMatch(html, /<script\b/);
  assert.doesNotMatch(html, /src="\/brand/);
});

test('standalone export escapes derived content into the markup', () => {
  const xssProfile: BeginnerProfile = {
    ...SPARSE_PROFILE,
    home: { name: '<img src=x onerror=alert(1)>', headline: 'a & b "c"' },
  };
  const html = buildStandaloneCardHtml(xssProfile, '', 'https://loom.app/digital-me');
  // The crafted name must be escaped, not injected as a live element.
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});
