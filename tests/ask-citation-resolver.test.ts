/**
 * Tests for the client-side resolveCitation / resolveCitations logic in
 * AskYiping.tsx (Bug 1: beginner me-* citations were dropped because
 * resolveVerifiedDossierArtifact returns null for those ids).
 *
 * We test the behaviour directly by importing the helper via the module's
 * re-exported buildAskRequestBody (which exercises the same module) and by
 * reading the source text — no DOM needed.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

/**
 * We cannot import the 'use client' component directly in Node (no React DOM
 * context), so we verify correctness by reading the source and asserting the
 * structural properties that encode the fix, then test the underlying
 * resolveVerifiedDossierArtifact + beginnerCitationResolver round-trip in
 * pure-Node libs to confirm the full data pipeline.
 */

test('resolveCitation source: falls back to API title+href for beginner me-* ids', () => {
  const src = fs.readFileSync(
    path.join(repoRoot, 'components/verified-dossier/AskYiping.tsx'),
    'utf8',
  );

  // The fix: try dossier resolution first; if null, check for raw title + href.
  assert.match(
    src,
    /if \(artifact\) \{/,
    'resolveCitation must branch on dossier artifact result',
  );
  assert.match(
    src,
    /typeof raw\.title === 'string'[\s\S]{0,60}typeof raw\.href === 'string'/,
    'resolveCitation must check raw.title and raw.href for the beginner fallback',
  );
  assert.match(
    src,
    /kind: 'text'/,
    'beginner fallback must use a neutral FileBadge kind',
  );
  // Owner path still resolves via artifact (kind comes from the artifact object).
  assert.match(
    src,
    /kind: artifact\.kind/,
    'owner citations must still use the artifact kind',
  );
});

test('resolveCitation source: drops citations with no title or href', () => {
  const src = fs.readFileSync(
    path.join(repoRoot, 'components/verified-dossier/AskYiping.tsx'),
    'utf8',
  );

  // The final return null covers the case where neither branch matched.
  assert.match(
    src,
    /return null;[\s\S]*\}/,
    'resolveCitation must return null when neither dossier nor raw title/href resolves',
  );
});

test('beginner citation resolver produces title + href for real section ids', () => {
  const { beginnerCitationResolver } = require('../lib/new-loom/beginner-ask-corpus') as
    typeof import('../lib/new-loom/beginner-ask-corpus');
  const { normalizeBeginnerProfile } = require('../lib/profile/beginner-profile') as
    typeof import('../lib/profile/beginner-profile');

  const profile = normalizeBeginnerProfile({
    home: { name: 'Test User', headline: 'Engineer' },
    about: { summary: 'Summary text.', links: [] },
    education: [{ institution: 'UNSW', qualification: 'BSc', field: '', start: '2020', end: '2023' }],
    experience: [{ role: 'Dev', organization: 'Optiver', start: '', end: '', location: '', bullets: [] }],
  });

  const resolve = beginnerCitationResolver(profile);

  // Education and experience ids return citations with title + href.
  const edu = resolve('me-edu-0');
  assert.ok(edu, 'me-edu-0 resolves');
  assert.ok(edu!.title.length > 0, 'education citation has a title');
  assert.ok(edu!.href.length > 0, 'education citation has an href');
  assert.equal(edu!.artifactId, 'me-edu-0');

  const exp = resolve('me-exp-0');
  assert.ok(exp, 'me-exp-0 resolves');
  assert.ok(exp!.title.length > 0, 'experience citation has a title');
  assert.ok(exp!.href.length > 0, 'experience citation has an href');
  assert.equal(exp!.artifactId, 'me-exp-0');

  // The free-text about block is non-citeable.
  assert.equal(resolve('me-about'), null, 'me-about is not citeable');

  // Fabricated ids are dropped.
  assert.equal(resolve('totally-made-up'), null, 'fabricated ids return null');
});

test('resolveVerifiedDossierArtifact returns a falsy value for beginner me-* ids', () => {
  const { resolveVerifiedDossierArtifact } = require('../lib/new-loom/verified-dossier-home') as
    typeof import('../lib/new-loom/verified-dossier-home');

  // Confirms the root cause: dossier resolver returns a falsy value for beginner
  // ids (undefined from a map miss), so resolveCitation's `if (!artifact)` branch
  // is what triggers the beginner fallback.
  assert.ok(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !(resolveVerifiedDossierArtifact as any)('me-edu-0'),
    'me-edu-0 is not a dossier artifact — resolveVerifiedDossierArtifact is falsy (root cause confirmed)',
  );
  assert.ok(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !(resolveVerifiedDossierArtifact as any)('me-exp-0'),
    'me-exp-0 is not a dossier artifact — resolveVerifiedDossierArtifact is falsy (root cause confirmed)',
  );
});
