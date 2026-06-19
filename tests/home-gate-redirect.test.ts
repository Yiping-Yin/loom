/**
 * Tests for Bug 2: the Home gate redirect behavior.
 *
 * Before the fix, app/page.tsx did `if (!configured) redirect('/onboarding')`
 * server-side, which blocked profile-only users from ever reaching
 * HomeProfileView. The fix moves the redirect decision to the client HomeGate,
 * which can inspect localStorage.
 *
 * These tests verify:
 * 1. app/page.tsx no longer contains a server-side redirect to /onboarding.
 * 2. app/page.tsx passes `configured` to HomeGate.
 * 3. HomeGate accepts a `configured` prop and performs a client-side redirect.
 * 4. HomeGate renders the profile view when a profile is present (regardless of `configured`).
 * 5. HomeGate renders HomeClient as the SSR/first-paint fallback (renderToStaticMarkup contract).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('app/page.tsx does NOT redirect to /onboarding server-side', () => {
  const page = read('app/page.tsx');

  assert.doesNotMatch(
    page,
    /if \(!configured\) redirect/,
    'server-side redirect must be removed; the redirect is now handled client-side in HomeGate',
  );
  assert.doesNotMatch(
    page,
    /redirect\('\/onboarding'\)/,
    'app/page.tsx must not redirect to /onboarding (beginner profile-only users would be blocked)',
  );
});

test('app/page.tsx passes configured to HomeGate', () => {
  const page = read('app/page.tsx');

  assert.match(
    page,
    /<HomeGate configured=\{configured\}/,
    'app/page.tsx must pass the configured flag to HomeGate',
  );
});

test('HomeGate accepts a configured prop and does client-side redirect when no profile and not configured', () => {
  const gate = read('app/HomeGate.tsx');

  // The prop must be declared.
  assert.match(
    gate,
    /configured\s*\}:\s*\{\s*configured:\s*boolean/,
    'HomeGate must declare a configured: boolean prop',
  );

  // The redirect must use next/navigation router.replace (client-side).
  assert.match(
    gate,
    /useRouter/,
    'HomeGate must use useRouter for client-side navigation',
  );
  assert.match(
    gate,
    /router\.replace\('\/onboarding'\)/,
    "HomeGate must call router.replace('/onboarding') for the first-run path",
  );

  // The redirect is guarded: only when no profile AND not configured.
  assert.match(
    gate,
    /if \(!localProfile && !configured\)/,
    'redirect must only fire when there is no local profile AND configured is false',
  );
});

test('HomeGate renders HomeClient as the SSR first-paint fallback (dossier contract preserved)', () => {
  const gate = read('app/HomeGate.tsx');

  // HomeClient must still be the un-mounted / SSR output.
  assert.match(
    gate,
    /return <HomeClient \/>/,
    'HomeClient must remain the SSR/first-paint fallback so the dossier renderToStaticMarkup contract holds',
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
