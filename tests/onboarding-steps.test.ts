/**
 * tests/onboarding-steps.test.ts
 *
 * Contracts for the pure onboarding step logic extracted into
 * lib/onboarding/steps.ts. No React/jsdom/CSS — a plain `import` runs these,
 * which is the whole point of keeping the engine pure and reusable.
 *
 * Run via: npm run test:contracts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAnswer, stepPrompt, progressOf, TOTAL_STEPS } from '../lib/onboarding/steps';
import { emptyBeginnerProfile } from '../lib/profile/beginner-profile';

test('TOTAL_STEPS is a positive integer', () => {
  assert.ok(Number.isInteger(TOTAL_STEPS) && TOTAL_STEPS > 0);
});

test('first step asks for the name and applyAnswer stores it', () => {
  const start = { id: 'name' } as const;
  assert.match(stepPrompt(start), /name/i);
  const { profile, next } = applyAnswer(emptyBeginnerProfile(), start, 'Lin Wei');
  assert.equal(profile.home.name, 'Lin Wei');
  assert.notDeepEqual(next, start);
});

test('progressOf is monotonic-ish from name to review', () => {
  assert.ok(progressOf({ id: 'name' }) <= progressOf({ id: 'review' }));
});
