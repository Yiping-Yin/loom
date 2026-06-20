import assert from 'node:assert/strict';
import test from 'node:test';

import { type BeginnerProfile } from '../lib/profile/beginner-profile';
import {
  buildShareUrl,
  decodeProfileFromHash,
  encodeProfileToHash,
} from '../lib/profile/profile-share';

const FULL_PROFILE: BeginnerProfile = {
  version: 1,
  home: { name: 'Amélie Zhang 张爱玲', headline: 'Quant Researcher · 量化研究' },
  about: {
    summary: 'Building grounded, cited self-representation. 🌙 Loves probability & options.',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/amelie' },
      { label: 'Email', href: 'mailto:amelie@example.com' },
    ],
  },
  education: [
    {
      institution: 'UNSW',
      qualification: 'BSc',
      field: 'Mathematics',
      start: '2021',
      end: '2024',
      notes: 'First-class honours',
    },
  ],
  experience: [
    {
      role: 'Trading Intern',
      organization: 'Optiver',
      start: '2023',
      end: '2023',
      location: 'Sydney',
      bullets: ['Built a market-making simulator', 'Calibrated vega exposure'],
    },
  ],
  works: [
    {
      title: 'Options Pricing Engine',
      description: 'A from-scratch Black–Scholes + binomial pricer.',
      link: 'https://github.com/amelie/pricer',
      role: 'Author',
      date: '2024',
    },
  ],
  // Artifacts are intentionally stripped from the share payload (blobs live in
  // the origin device's IndexedDB), so a round-tripped profile normalizes to [].
  artifacts: [],
  capabilities: [],
};

test('encode → decode round-trips a full profile (incl. Unicode + emoji)', () => {
  const hash = encodeProfileToHash(FULL_PROFILE);
  const decoded = decodeProfileFromHash(hash);
  assert.deepEqual(decoded, FULL_PROFILE);
});

test('decode tolerates a leading # on the hash', () => {
  const hash = encodeProfileToHash(FULL_PROFILE);
  const withHash = decodeProfileFromHash(`#${hash}`);
  assert.deepEqual(withHash, FULL_PROFILE);
});

test('encode produces a URL-safe base64url payload (no +, /, or =)', () => {
  const hash = encodeProfileToHash(FULL_PROFILE);
  assert.doesNotMatch(hash, /[+/=]/);
});

test('decode of garbage returns null', () => {
  assert.equal(decodeProfileFromHash('not-base64-$$$'), null);
  assert.equal(decodeProfileFromHash('#####'), null);
  assert.equal(decodeProfileFromHash(''), null);
  assert.equal(decodeProfileFromHash('#'), null);
  // Valid base64url of a non-JSON byte string → JSON.parse fails → null.
  assert.equal(decodeProfileFromHash(encodeURIComponent('xyz')), null);
});

test('decode runs normalize: a crafted javascript: link is stripped', () => {
  const malicious = {
    version: 1,
    home: { name: 'Mallory', headline: 'Attacker' },
    about: {
      summary: 'hi',
      links: [
        { label: 'evil', href: 'javascript:alert(document.cookie)' },
        { label: 'ok', href: 'https://example.com' },
      ],
    },
    education: [],
    experience: [],
    works: [{ title: 'payload', link: 'javascript:alert(1)' }],
  };
  // Encode the crafted object directly (bypassing the typed encode signature),
  // simulating an attacker hand-building a hash.
  const json = JSON.stringify(malicious);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const hash = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const decoded = decodeProfileFromHash(hash);
  assert.ok(decoded, 'crafted-but-valid payload should decode to a normalized profile');
  // The javascript: about link is dropped; only the safe https link survives.
  assert.equal(decoded!.about.links.length, 1);
  assert.equal(decoded!.about.links[0].href, 'https://example.com');
  // The javascript: work link collapses to undefined (plain text, no anchor).
  assert.equal(decoded!.works[0].link, undefined);
  // No surviving field carries a javascript: scheme.
  assert.doesNotMatch(JSON.stringify(decoded), /javascript:/);
});

test('decode caps oversized fields via normalize', () => {
  const huge = {
    version: 1,
    home: { name: 'x'.repeat(5000), headline: 'y'.repeat(5000) },
    about: { summary: 'z'.repeat(9000), links: [] },
    education: [],
    experience: [],
    works: [],
  };
  const json = JSON.stringify(huge);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const hash = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const decoded = decodeProfileFromHash(hash);
  assert.ok(decoded);
  // FIELD_MAX = 300, SUMMARY_MAX = 2000 (see normalizeBeginnerProfile).
  assert.equal(decoded!.home.name.length, 300);
  assert.equal(decoded!.home.headline.length, 300);
  assert.equal(decoded!.about.summary.length, 2000);
});

test('buildShareUrl has the /card#<hash> shape', () => {
  const url = buildShareUrl('https://loom.app', FULL_PROFILE);
  assert.match(url, /^https:\/\/loom\.app\/card#/);
  const hash = url.slice(url.indexOf('#'));
  const decoded = decodeProfileFromHash(hash);
  assert.deepEqual(decoded, FULL_PROFILE);
});

test('buildShareUrl preserves a trailing-slashless origin verbatim', () => {
  const url = buildShareUrl('http://localhost:3000', FULL_PROFILE);
  assert.ok(url.startsWith('http://localhost:3000/card#'));
});
