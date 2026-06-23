import assert from 'node:assert/strict';
import test from 'node:test';
import { OWNER_PROFILE } from '../lib/profile/owner-profile';
import { normalizeBeginnerProfile } from '../lib/profile/beginner-profile';

test('OWNER_PROFILE is a valid, bounded BeginnerProfile (round-trips through normalize)', () => {
  // If the profile carried anything the storage seam would strip/cap (unsafe
  // href, oversized field, malformed entry), normalize would change it. A clean
  // round-trip proves the seed is exactly what gets persisted.
  const normalized = normalizeBeginnerProfile(OWNER_PROFILE);
  assert.deepEqual(normalized, OWNER_PROFILE);
});

test('OWNER_PROFILE carries the owner identity', () => {
  assert.equal(OWNER_PROFILE.home.name, 'Yiping Yin');
  assert.ok(OWNER_PROFILE.home.headline.length > 0);
  assert.ok(OWNER_PROFILE.about.summary.length > 40);
});

test('OWNER_PROFILE has real narrative across every section', () => {
  assert.ok(OWNER_PROFILE.education.length >= 2);
  assert.ok(OWNER_PROFILE.experience.length >= 2);
  assert.ok(OWNER_PROFILE.works.length >= 1);
  // Every experience entry carries at least one bullet (grounding for capabilities).
  for (const exp of OWNER_PROFILE.experience) {
    assert.ok(exp.bullets.length >= 1, `${exp.organization} has no bullets`);
  }
});

test('OWNER_PROFILE links all survive the safe-href allowlist', () => {
  assert.ok(OWNER_PROFILE.about.links.length >= 1);
  for (const link of OWNER_PROFILE.about.links) {
    assert.ok(link.href.length > 0, `${link.label} href was dropped`);
  }
});

test('OWNER_PROFILE has a grounded, valid capability map', () => {
  const caps = OWNER_PROFILE.capabilities ?? [];
  assert.ok(caps.length >= 1, 'no capabilities derived');
  for (const cap of caps) {
    assert.ok(cap.id && cap.label, 'capability missing id/label');
    assert.ok(['strong', 'partial', 'direction'].includes(cap.status));
    assert.ok(Array.isArray(cap.evidence));
  }
});
