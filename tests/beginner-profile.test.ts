import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { emptyBeginnerProfile, normalizeBeginnerProfile } from '../lib/profile/beginner-profile';
import { readBeginnerProfile, writeBeginnerProfile } from '../lib/profile/profile-store';

test('emptyBeginnerProfile is a valid empty shape', () => {
  const p = emptyBeginnerProfile();
  assert.equal(p.version, 1);
  assert.deepEqual(p.education, []);
  assert.deepEqual(p.about.links, []);
});

test('normalize coerces garbage to safe defaults', () => {
  assert.deepEqual(normalizeBeginnerProfile(null), emptyBeginnerProfile());
  assert.deepEqual(normalizeBeginnerProfile('nope'), emptyBeginnerProfile());
  const p = normalizeBeginnerProfile({ home: { name: 5 }, education: 'x', about: { links: 'y' } });
  assert.equal(p.home.name, '');
  assert.deepEqual(p.education, []);
  assert.deepEqual(p.about.links, []);
});

test('normalize preserves valid data and drops empty entries', () => {
  const p = normalizeBeginnerProfile({
    home: { name: 'Ada', headline: 'Engineer' },
    about: { summary: 'hi', links: [{ label: 'GitHub', href: 'https://x' }, { href: '' }] },
    education: [{ institution: 'UNSW', qualification: 'BSc' }, {}],
    experience: [{ role: 'Dev', organization: 'Acme', bullets: ['shipped', 7] }, { bullets: [] }],
  });
  assert.equal(p.home.name, 'Ada');
  assert.equal(p.about.links.length, 1);
  assert.equal(p.education.length, 1);
  assert.equal(p.experience.length, 1);
  assert.deepEqual(p.experience[0].bullets, ['shipped']);
});

test('store round-trips a profile and returns null when missing', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'loom-profile-'));
  const file = path.join(dir, 'beginner-profile.json');
  try {
    assert.equal(await readBeginnerProfile(file), null);
    await writeBeginnerProfile(
      normalizeBeginnerProfile({ home: { name: 'Ada', headline: 'Eng' } }),
      file,
    );
    const back = await readBeginnerProfile(file);
    assert.equal(back?.home.name, 'Ada');
    assert.equal(back?.version, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('api/profile route wires GET+POST to the store and normalizer', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/profile/route.ts'), 'utf8');
  assert.match(src, /export async function GET/);
  assert.match(src, /export async function POST/);
  assert.match(src, /readBeginnerProfile/);
  assert.match(src, /writeBeginnerProfile/);
  assert.match(src, /normalizeBeginnerProfile/);
  assert.match(src, /runtime = ['"]nodejs['"]/);
});
