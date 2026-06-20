/**
 * Contract tests for the M2a artifact slice (store + schema + card).
 *
 * IndexedDB and pdfjs cannot run under node:test, so we exercise only the PURE
 * parts: ArtifactRef normalization (caps + drops), the empty-profile default,
 * the VerifiedArtifactCard render for a given ref (name + Open affordance, and
 * the missing-blob fallback path), and a structural assertion that the store
 * module exports the expected API. No real IndexedDB is touched here.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

import {
  emptyBeginnerProfile,
  normalizeBeginnerProfile,
  type BeginnerProfile,
} from '../lib/profile/beginner-profile';

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
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const SMALL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// ── emptyBeginnerProfile ─────────────────────────────────────────────────────

test('emptyBeginnerProfile().artifacts is an empty array', () => {
  const p = emptyBeginnerProfile();
  assert.ok(Array.isArray(p.artifacts), 'artifacts must be an array');
  assert.deepEqual(p.artifacts, []);
});

// ── ArtifactRef normalization ────────────────────────────────────────────────

test('normalizeBeginnerProfile keeps a valid ArtifactRef and its fields', () => {
  const raw = {
    version: 1,
    artifacts: [
      { id: 'af_1', name: 'CV.pdf', kind: 'pdf', label: 'My CV', thumbnailDataUri: SMALL_PNG },
    ],
  };
  const p = normalizeBeginnerProfile(raw);
  assert.equal(p.artifacts?.length, 1);
  const ref = p.artifacts![0];
  assert.equal(ref.id, 'af_1');
  assert.equal(ref.name, 'CV.pdf');
  assert.equal(ref.kind, 'pdf');
  assert.equal(ref.label, 'My CV');
  assert.equal(ref.thumbnailDataUri, SMALL_PNG);
});

test('normalizeBeginnerProfile drops artifacts missing an id or name', () => {
  const raw = {
    version: 1,
    artifacts: [
      { name: 'no-id.pdf', kind: 'pdf' }, // missing id
      { id: 'af_2', kind: 'image' }, // missing name
      { id: 'af_3', name: 'kept.png', kind: 'image' }, // valid
      'not-an-object',
      null,
    ],
  };
  const p = normalizeBeginnerProfile(raw);
  assert.equal(p.artifacts?.length, 1);
  assert.equal(p.artifacts![0].id, 'af_3');
});

test('normalizeBeginnerProfile defaults a missing/blank kind to "other"', () => {
  const raw = { version: 1, artifacts: [{ id: 'af_4', name: 'thing' }] };
  const p = normalizeBeginnerProfile(raw);
  assert.equal(p.artifacts![0].kind, 'other');
});

test('normalizeBeginnerProfile caps the name and label lengths', () => {
  const raw = {
    version: 1,
    artifacts: [{ id: 'af_5', name: 'n'.repeat(5000), label: 'l'.repeat(5000), kind: 'doc' }],
  };
  const p = normalizeBeginnerProfile(raw);
  const ref = p.artifacts![0];
  assert.ok(ref.name.length <= 200, `name should be capped, got ${ref.name.length}`);
  assert.ok((ref.label ?? '').length <= 120, `label should be capped, got ${ref.label?.length}`);
});

test('normalizeBeginnerProfile caps the number of artifacts', () => {
  const many = Array.from({ length: 100 }, (_unused, i) => ({
    id: `af_${i}`,
    name: `doc-${i}`,
    kind: 'other',
  }));
  const p = normalizeBeginnerProfile({ version: 1, artifacts: many });
  assert.ok((p.artifacts?.length ?? 0) <= 24, `array should be capped, got ${p.artifacts?.length}`);
});

test('normalizeBeginnerProfile drops a non-image/oversized thumbnail data URI', () => {
  const raw = {
    version: 1,
    artifacts: [
      { id: 'af_a', name: 'evil', kind: 'doc', thumbnailDataUri: 'data:text/html;base64,PHNjcmlwdD4=' },
      { id: 'af_b', name: 'huge', kind: 'image', thumbnailDataUri: 'data:image/png;base64,' + 'A'.repeat(300_000) },
    ],
  };
  const p = normalizeBeginnerProfile(raw);
  assert.equal(p.artifacts![0].thumbnailDataUri, undefined, 'non-image data URI must be dropped');
  assert.equal(p.artifacts![1].thumbnailDataUri, undefined, 'oversized thumbnail must be dropped');
});

test('normalizeBeginnerProfile yields [] artifacts when none are present', () => {
  const p = normalizeBeginnerProfile({ version: 1 });
  assert.deepEqual(p.artifacts, []);
});

// ── VerifiedArtifactCard render ──────────────────────────────────────────────

test('VerifiedArtifactCard renders the name, a Verified mark, and an Open affordance', () => {
  const { VerifiedArtifactCard } = require('../components/VerifiedArtifactCard') as typeof import('../components/VerifiedArtifactCard');
  const ref = { id: 'af_x', name: 'Transcript.pdf', kind: 'pdf' };
  const html = render(<VerifiedArtifactCard artifact={ref} />);
  const text = visibleText(html);

  assert.match(text, /Transcript\.pdf/);
  assert.match(text, /Verified/);
  assert.match(text, /Open/);
});

test('VerifiedArtifactCard prefers the label over the filename when present', () => {
  const { VerifiedArtifactCard } = require('../components/VerifiedArtifactCard') as typeof import('../components/VerifiedArtifactCard');
  const ref = { id: 'af_y', name: 'scan_0001.pdf', kind: 'pdf', label: 'UNSW Transcript' };
  const html = render(<VerifiedArtifactCard artifact={ref} />);
  const text = visibleText(html);

  assert.match(text, /UNSW Transcript/);
});

test('VerifiedArtifactCard renders an <img> when a thumbnail data URI is present', () => {
  const { VerifiedArtifactCard } = require('../components/VerifiedArtifactCard') as typeof import('../components/VerifiedArtifactCard');
  const ref = { id: 'af_z', name: 'Cert.png', kind: 'image', thumbnailDataUri: SMALL_PNG };
  const html = render(<VerifiedArtifactCard artifact={ref} />);

  assert.match(html, /<img[^>]+src="data:image\/png;base64,/);
});

test('VerifiedArtifactCard shows a kind glyph when there is no thumbnail', () => {
  const { VerifiedArtifactCard } = require('../components/VerifiedArtifactCard') as typeof import('../components/VerifiedArtifactCard');
  const ref = { id: 'af_g', name: 'notes.txt', kind: 'doc' };
  const html = render(<VerifiedArtifactCard artifact={ref} />);
  const text = visibleText(html);

  // No <img>; the glyph extension label is present instead.
  assert.doesNotMatch(html, /<img/);
  assert.match(text, /DOC/);
});

test('VerifiedArtifactCard renders a Remove control only when onDelete is provided', () => {
  const { VerifiedArtifactCard } = require('../components/VerifiedArtifactCard') as typeof import('../components/VerifiedArtifactCard');
  const ref = { id: 'af_d', name: 'doc.pdf', kind: 'pdf' };

  const withDelete = render(<VerifiedArtifactCard artifact={ref} onDelete={() => {}} />);
  assert.match(visibleText(withDelete), /Remove/);

  const withoutDelete = render(<VerifiedArtifactCard artifact={ref} />);
  assert.doesNotMatch(visibleText(withoutDelete), /Remove/);
});

// ── artifact-store module shape (structural — no IndexedDB exercised) ─────────

test('artifact-store exports the expected client API', () => {
  const store = require('../lib/artifact/artifact-store') as typeof import('../lib/artifact/artifact-store');
  assert.equal(typeof store.putArtifact, 'function');
  assert.equal(typeof store.getArtifactObjectUrl, 'function');
  assert.equal(typeof store.listArtifactMeta, 'function');
  assert.equal(typeof store.deleteArtifact, 'function');
});

test('artifact-store functions are SSR-safe: no IndexedDB call at import time', () => {
  // Importing the module must not touch indexedDB/window. Under node there is no
  // `window`, so listArtifactMeta resolves to [] rather than throwing.
  const store = require('../lib/artifact/artifact-store') as typeof import('../lib/artifact/artifact-store');
  return store.listArtifactMeta().then((list) => {
    assert.deepEqual(list, []);
  });
});

// ── The beginner profile carries artifacts through the digital-me surface ─────

test('BeginnerDigitalMe renders the Proof & documents section', () => {
  const { BeginnerDigitalMe } = require('../app/digital-me/BeginnerDigitalMe') as typeof import('../app/digital-me/BeginnerDigitalMe');
  const profile: BeginnerProfile = {
    ...emptyBeginnerProfile(),
    home: { name: 'Alex Chen', headline: 'Engineer' },
  };
  const html = render(<BeginnerDigitalMe profile={profile} />);
  const text = visibleText(html);

  assert.match(text, /Proof & documents/i);
  assert.match(text, /Verified artifacts/);
  assert.match(text, /Add documents/);
});
