import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const loaderSrc = readFileSync(
  fileURLToPath(new URL('../app/me/MeLoader.tsx', import.meta.url)),
  'utf8',
);
const pageSrc = readFileSync(
  fileURLToPath(new URL('../app/me/page.tsx', import.meta.url)),
  'utf8',
);

test('/me loader wires the owner profile into local storage', () => {
  assert.match(loaderSrc, /OWNER_PROFILE/);
  assert.match(loaderSrc, /writeBeginnerProfileLocal\(OWNER_PROFILE\)/);
});

test('/me loader navigates into the live Digital Me after loading', () => {
  assert.match(loaderSrc, /router\.push\(['"]\/digital-me['"]\)/);
});

test('/me loader offers a reset-to-empty path', () => {
  assert.match(loaderSrc, /emptyBeginnerProfile\(\)/);
  assert.match(loaderSrc, /Reset to empty/);
});

test('/me loader exposes the load action and handles a failed write', () => {
  assert.match(loaderSrc, /Load my profile/);
  // A failed localStorage write must NOT navigate (would strand on a blank page).
  assert.match(loaderSrc, /if \(!ok\)/);
});

test('/me page renders the loader and sets a title', () => {
  assert.match(pageSrc, /MeLoader/);
  assert.match(pageSrc, /metadata/);
});

test('the identity empty state exposes a reachable /me owner entry (app has no address bar)', () => {
  const emptySrc = readFileSync(
    fileURLToPath(new URL('../app/IdentityEmptyState.tsx', import.meta.url)),
    'utf8',
  );
  assert.match(emptySrc, /href="\/me"/);
});
