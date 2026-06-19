import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAskRequestBody } from '../lib/new-loom/ask-yiping-body';
import { normalizeBeginnerProfile } from '../lib/profile/beginner-profile';

// A minimal but content-bearing beginner profile (same shape used in beginner-ask-corpus tests).
const sampleProfile = normalizeBeginnerProfile({
  home: { name: 'Ada Lovelace', headline: 'Engineer & mathematician' },
  about: { summary: 'Builder of analytical engines.', links: [] },
  education: [],
  experience: [],
});

test('buildAskRequestBody includes profile in the body when a profile is provided', () => {
  const body = buildAskRequestBody('What are my skills?', sampleProfile);
  assert.equal(body.question, 'What are my skills?');
  assert.deepEqual(body.profile, sampleProfile);
});

test('buildAskRequestBody omits profile when null is passed', () => {
  const body = buildAskRequestBody('What are my skills?', null);
  assert.equal(body.question, 'What are my skills?');
  assert.ok(!('profile' in body), 'profile key must be absent when null');
});

test('buildAskRequestBody omits profile when undefined is passed', () => {
  const body = buildAskRequestBody('What are my skills?', undefined);
  assert.equal(body.question, 'What are my skills?');
  assert.ok(!('profile' in body), 'profile key must be absent when undefined');
});

test('buildAskRequestBody preserves the question exactly', () => {
  const body = buildAskRequestBody('hello world', null);
  assert.equal(body.question, 'hello world');
});

test('buildAskRequestBody body with profile serialises round-trip correctly', () => {
  const body = buildAskRequestBody('test question', sampleProfile);
  const json = JSON.parse(JSON.stringify(body)) as typeof body;
  assert.equal(json.question, 'test question');
  assert.deepEqual(json.profile, sampleProfile);
});
