import assert from 'node:assert/strict';
import test from 'node:test';
import { assessAnswer } from '../lib/onboarding/assess-answer';

test('empty answer is bad', () => {
  assert.equal(assessAnswer('name', '   ').level, 'bad');
});

test('keyboard-mash / gibberish is bad', () => {
  assert.equal(assessAnswer('name', 'asdfgh').level, 'bad');
  assert.equal(assessAnswer('name', 'sdfghjkl').level, 'bad'); // no vowels
  assert.equal(assessAnswer('summary', 'aaaaaaa').level, 'bad'); // repeat run
});

test('name with a URL or all-digits is bad', () => {
  assert.equal(assessAnswer('name', 'http://x.com').level, 'bad');
  assert.equal(assessAnswer('name', '12345').level, 'bad');
});

test('name that reads like a sentence/question is weak', () => {
  assert.equal(assessAnswer('name', 'what should I put here?').level, 'weak');
});

test('headline that is chatty / a question is weak', () => {
  assert.equal(
    assessAnswer('headline', 'im doing great. do u have any recommadation for tdy?').level,
    'weak',
  );
  assert.equal(assessAnswer('headline', '你能推荐点什么吗').level, 'weak');
});

test('plausible values are ok', () => {
  assert.equal(assessAnswer('name', 'Lin Wei').level, 'ok');
  assert.equal(assessAnswer('headline', 'Finance student · Python & derivatives').level, 'ok');
  assert.equal(assessAnswer('summary', 'Recent CS graduate who builds small data tools.').level, 'ok');
});

test('bad/weak results carry a hint; ok does not', () => {
  assert.ok(assessAnswer('name', 'asdfgh').hint);
  assert.equal(assessAnswer('name', 'Lin Wei').hint, undefined);
});
