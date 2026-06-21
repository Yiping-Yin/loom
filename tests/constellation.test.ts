import assert from 'node:assert/strict';
import test from 'node:test';
import { constellationFor } from '../lib/onboarding/constellation';
import { emptyBeginnerProfile } from '../lib/profile/beginner-profile';

test('empty profile yields no stars', () => {
  assert.deepEqual(constellationFor(emptyBeginnerProfile()).stars, []);
});
test('a named profile with one area yields >=1 star with stable, in-bounds coords', () => {
  const p = emptyBeginnerProfile();
  p.home.name = 'Lin Wei';
  p.home.headline = 'Finance student';
  const a = constellationFor(p);
  const b = constellationFor(p);
  assert.ok(a.stars.length >= 1);
  assert.deepEqual(a, b); // deterministic, NO Math.random
  for (const s of a.stars) { assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100); }
});
