/**
 * Tests for the Home gate default behavior.
 *
 * History:
 * - Bug 2 (earlier): app/page.tsx redirected to /onboarding server-side, which
 *   blocked profile-only users from ever reaching HomeProfileView. The fix moved
 *   the redirect decision to the client HomeGate.
 * - F2 step 2 (current): the default `/` route is now a generic product surface.
 *   A no-profile STRANGER must NOT see the owner dossier (HomeClient, now at
 *   /example) and must NOT be redirected to /onboarding (a dead-end). Instead
 *   HomeGate renders the neutral on-brand HomeLanding, whose CTAs are the entry
 *   points. The `configured` prop and content-root redirect are retired.
 *
 * These tests verify the NEW intent:
 * 1. app/page.tsx does NOT redirect to /onboarding (server- or client-side).
 * 2. app/page.tsx renders HomeGate with no `configured` plumbing.
 * 3. HomeGate no longer redirects (no useRouter / router.replace) — the landing
 *    replaces the old first-run redirect.
 * 4. HomeGate renders HomeLanding (the neutral landing) as the SSR/first-paint
 *    no-profile fallback — NOT the owner HomeClient.
 * 5. HomeGate renders HomeProfileView when a profile is present.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('app/page.tsx does NOT redirect to /onboarding', () => {
  const page = read('app/page.tsx');

  assert.doesNotMatch(
    page,
    /redirect\('\/onboarding'\)/,
    'app/page.tsx must not redirect to /onboarding; the neutral landing replaces the first-run dead-end',
  );
  assert.doesNotMatch(
    page,
    /if \(!configured\) redirect/,
    'the old server-side content-root redirect must stay removed',
  );
});

test('app/page.tsx renders HomeGate without configured plumbing', () => {
  const page = read('app/page.tsx');

  assert.match(page, /<HomeGate \/>/, 'app/page.tsx must render <HomeGate /> as the default surface');
  assert.doesNotMatch(
    page,
    /configured/,
    'the content-root `configured` flag is retired now that the landing replaces the redirect',
  );
});

test('HomeGate no longer redirects — the neutral landing replaces the first-run redirect', () => {
  const gate = read('app/HomeGate.tsx');

  assert.doesNotMatch(
    gate,
    /useRouter/,
    'HomeGate must not use useRouter; there is no content-root redirect anymore',
  );
  assert.doesNotMatch(
    gate,
    /router\.replace\('\/onboarding'\)/,
    'HomeGate must not redirect to /onboarding; a stranger sees the neutral landing instead',
  );
  assert.doesNotMatch(
    gate,
    /configured/,
    'HomeGate must not take a configured prop anymore',
  );
});

test('HomeGate renders the neutral HomeLanding as the no-profile SSR first paint (NOT the owner dossier)', () => {
  const gate = read('app/HomeGate.tsx');

  assert.match(
    gate,
    /return <HomeLanding \/>/,
    'HomeLanding must be the no-profile SSR/first-paint fallback so a stranger never sees the owner dossier by default',
  );
  assert.doesNotMatch(
    gate,
    /HomeClient/,
    'HomeGate must NOT render the owner HomeClient (verified dossier) — it lives only at /example now',
  );
});

test('HomeGate renders HomeProfileView when profile is present', () => {
  const gate = read('app/HomeGate.tsx');

  assert.match(
    gate,
    /if \(mounted && profile\)/,
    'HomeGate must check mounted + profile before swapping to HomeProfileView',
  );
  assert.match(
    gate,
    /return <HomeProfileView profile=\{profile\} \/>/,
    'HomeGate must render HomeProfileView when a profile is present',
  );
});
