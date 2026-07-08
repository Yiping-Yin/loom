import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/**
 * FRONT-DOOR CONTRACT (post landing-funnel retirement, owner 2026-07-08).
 *
 * The `/` route renders the verified owner dossier (HomeClient) directly.
 * The two-door HomeGate funnel — cosmic cover for strangers, localStorage
 * redirect for returners — was GTM-era product and is deleted; LOOM is a
 * local-first single-owner app. Guards:
 *   1. `/` renders HomeClient, with no gate and no onboarding redirect.
 *   2. The native You window's target (/you) renders the same surface, so
 *      the web front door and the native door can never diverge.
 */
test('app/page.tsx renders the owner dossier directly', () => {
  const source = read('app/page.tsx');
  assert.match(source, /HomeClient/);
  assert.doesNotMatch(source, /from '\.\/HomeGate'/);
  assert.doesNotMatch(source, /redirect\(/);
  assert.doesNotMatch(source, /useRouter|usePathname/);
});

test('/you (the native You window target) renders the same owner dossier', () => {
  const source = read('app/you/page.tsx');
  assert.match(source, /HomeClient/);
  assert.doesNotMatch(source, /from.*ExampleBanner/);
  assert.doesNotMatch(source, /window\.localStorage|readBeginnerProfile|writeBeginnerProfileLocal/);
});
