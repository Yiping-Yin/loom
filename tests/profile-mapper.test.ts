import test from 'node:test';
import assert from 'node:assert/strict';
import { rowToProfile, profileToRow, type ProfileRow } from '../lib/sync/profile-mapper';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

const profile: BeginnerProfile = {
  version: 1, home: { name: 'Yiping', headline: 'Quant' },
  about: { summary: 'hi', links: [] }, education: [], experience: [], works: [],
  artifacts: [], capabilities: [],
};

test('profileToRow carries user id + ISO updated_at', () => {
  const row = profileToRow(profile, 'user-1', 1_700_000_000_000);
  assert.equal(row.user_id, 'user-1');
  assert.equal(row.updated_at, new Date(1_700_000_000_000).toISOString());
  assert.equal((row.data as BeginnerProfile).home.name, 'Yiping');
});

test('rowToProfile normalizes (drops an unsafe href) and parses updatedAt', () => {
  const row: ProfileRow = {
    user_id: 'user-1',
    updated_at: new Date(1_700_000_000_000).toISOString(),
    data: { ...profile, about: { summary: 'hi', links: [{ label: 'x', href: 'javascript:alert(1)' }] } },
  };
  const { profile: out, updatedAt } = rowToProfile(row);
  assert.equal(updatedAt, 1_700_000_000_000);
  assert.equal(out.about.links.length, 0); // unsafe href dropped by normalize
});

test('rowToProfile on garbage data returns an empty-but-valid profile', () => {
  const { profile: out } = rowToProfile({ user_id: 'u', updated_at: new Date(0).toISOString(), data: 42 });
  assert.equal(out.version, 1);
  assert.equal(out.home.name, '');
});
