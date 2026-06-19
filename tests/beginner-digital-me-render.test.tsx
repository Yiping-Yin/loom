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
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
}

const SAMPLE_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Alex Chen', headline: 'Software Engineer' },
  about: {
    summary: 'Building reliable distributed systems and learning ML foundations.',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/alexchen' },
      { label: 'GitHub', href: 'https://github.com/alexchen' },
    ],
  },
  education: [],
  experience: [],
};

test('BeginnerDigitalMe renders name and headline', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Alex Chen/);
  assert.match(text, /Software Engineer/);
});

test('BeginnerDigitalMe renders about summary', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /Building reliable distributed systems and learning ML foundations\./);
});

test('BeginnerDigitalMe renders profile link labels with _blank and noreferrer', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  assert.match(text, /LinkedIn/);
  assert.match(text, /GitHub/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noreferrer"/);
});

test('BeginnerDigitalMe renders the Ask widget section', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);

  // AskYiping renders a <section aria-labelledby="ask-yiping-title"> at minimum.
  assert.match(html, /ask-yiping/i);
});

test('BeginnerDigitalMe omits Yiping Role-OS markers', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);
  const text = visibleText(html);

  // Proof-path panel markers
  assert.doesNotMatch(text, /Claim Engine/);
  assert.doesNotMatch(text, /Artifact Runtime/);
  // Evidence graph panel
  assert.doesNotMatch(text, /Evidence Graph/);
  // QBook market room
  assert.doesNotMatch(text, /Live Market Room/);
  // Role lens eyebrow
  assert.doesNotMatch(text, /Role Lens/);
  // CSS class markers from DigitalMeRoleOSClient-specific sections
  assert.doesNotMatch(html, /proofPath/);
  assert.doesNotMatch(html, /claimRail/);
  assert.doesNotMatch(html, /evidencePanel/);
  assert.doesNotMatch(html, /marketRoom/);
  assert.doesNotMatch(html, /roleLens/);
});

test('BeginnerDigitalMe renders page shell with correct aria-labelledby', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const html = render(<BeginnerDigitalMe profile={SAMPLE_PROFILE} />);

  assert.match(html, /aria-labelledby="digital-me-title"/);
  assert.match(html, /id="digital-me-title"/);
  assert.match(html, /loom-cosmic-field/);
});

test('BeginnerDigitalMe falls back to "Your name" when name is empty', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const emptyProfile: BeginnerProfile = {
    ...SAMPLE_PROFILE,
    home: { name: '', headline: '' },
    about: { summary: '', links: [] },
  };
  const html = render(<BeginnerDigitalMe profile={emptyProfile} />);
  const text = visibleText(html);

  assert.match(text, /Your name/);
});
