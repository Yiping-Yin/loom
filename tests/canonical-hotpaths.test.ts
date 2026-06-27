import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('high-frequency user flows point to canonical routes, not legacy top-level IA', () => {
  const onboarding = read('app/onboarding/OnboardingClient.tsx');
  const liveArtifact = read('components/LiveArtifact.tsx');
  const reviewThoughtMap = read('components/ReviewThoughtMap.tsx');

  assert.doesNotMatch(onboarding, /router\.push\('\/knowledge'\)/);
  assert.doesNotMatch(onboarding, /router\.push\('\/desk'\)/);
  assert.match(onboarding, /const ONBOARDING_DONE_ROUTE = '\/sources'/);
  assert.match(onboarding, /router\.push\(ONBOARDING_DONE_ROUTE\)/);

  assert.doesNotMatch(liveArtifact, /\/graph\?focus=/);
  assert.match(liveArtifact, /\/sources#reader-notes/);

  assert.doesNotMatch(reviewThoughtMap, /\/graph\?focus=/);
  assert.match(reviewThoughtMap, /\/sources#reader-notes/);
});
