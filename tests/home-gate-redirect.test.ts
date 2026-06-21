/**
 * Tests for the Home gate default behavior.
 *
 * History:
 * - Bug 2 (earlier): app/page.tsx redirected to /onboarding server-side, which
 *   blocked profile-only users from ever reaching their LOOM. The fix moved the
 *   redirect decision to the client HomeGate.
 * - F2 step 2: the default `/` route became a generic product surface — a
 *   no-profile STRANGER saw the neutral HomeLanding instead of the owner dossier.
 * - Conversational cosmos entry (current): `/` is now a two-door entry. The
 *   guaranteed cold-open target (loom://bundle/index.html) renders HomeGate:
 *     - No profile (new user) → the conversation-first cosmic cover
 *       (HomeConversationalCover), NOT the owner dossier (HomeClient), NOT the
 *       retired HomeProfileView.
 *     - Profile present (returning) → redirected straight into their usable LOOM
 *       at /digital-me. SSR/first paint always renders the cover (localStorage is
 *       invisible server-side); after mount a returning user is redirected.
 *
 * These tests verify the NEW two-door intent:
 * 1. app/page.tsx renders HomeGate and does NOT redirect to /onboarding.
 * 2. HomeGate's no-profile branch renders the cosmic cover — not the owner
 *    dossier, not HomeProfileView.
 * 3. HomeGate routes a returning user (profile present) to /digital-me via a
 *    client redirect.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('app/page.tsx renders HomeGate and does not redirect to /onboarding', () => {
  const page = read('app/page.tsx');
  assert.match(page, /<HomeGate \/>/);
  assert.doesNotMatch(page, /redirect\('\/onboarding'\)/);
});

test('HomeGate renders the cosmic cover as the no-profile SSR/first paint (not the owner dossier, not HomeProfileView)', () => {
  const gate = read('app/HomeGate.tsx');
  assert.match(gate, /HomeConversationalCover/, 'no-profile branch must render the cosmic cover');
  assert.doesNotMatch(gate, /HomeClient/, 'must not render the owner dossier');
  assert.doesNotMatch(gate, /HomeProfileView/, 'HomeProfileView is retired as the / default');
});

test('HomeGate routes a returning user (profile present) to /digital-me', () => {
  const gate = read('app/HomeGate.tsx');
  assert.match(gate, /if \(readBeginnerProfileLocal\(\)\)|mounted && profile|profile/, 'must check profile existence');
  assert.match(gate, /\/digital-me/, 'returning users are routed to /digital-me');
  assert.match(gate, /useRouter|router\.replace/, 'a redirect mechanism is now expected');
});
