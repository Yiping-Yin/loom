import assert from 'node:assert/strict';
import test from 'node:test';
import { assessHomeField } from '../lib/onboarding/form-gate';

test('flags a gibberish name', () => {
  assert.ok(assessHomeField('name', 'asdfgh'));
});
test('leaves a good name alone (undefined)', () => {
  assert.equal(assessHomeField('name', 'Lin Wei'), undefined);
});
test('flags a chatty headline', () => {
  assert.ok(assessHomeField('headline', 'do you have any recommendation?'));
});
test('flags an empty field', () => {
  assert.ok(assessHomeField('name', ''));
});
