import assert from 'node:assert/strict';
import test from 'node:test';
import { assessHomeFields } from '../lib/onboarding/form-gate';

test('flags a gibberish name, leaves a good headline alone', () => {
  const h = assessHomeFields({ name: 'asdfgh', headline: 'Finance student · Python' });
  assert.ok(h.name);
  assert.equal(h.headline, undefined);
});
test('flags a chatty headline', () => {
  const h = assessHomeFields({ name: 'Lin Wei', headline: 'do you have any recommendation?' });
  assert.equal(h.name, undefined);
  assert.ok(h.headline);
});
test('clean home → no hints', () => {
  assert.deepEqual(assessHomeFields({ name: 'Lin Wei', headline: 'Finance student' }), {});
});
test('empty required fields are flagged', () => {
  const h = assessHomeFields({ name: '', headline: '' });
  assert.ok(h.name);
  assert.ok(h.headline);
});
