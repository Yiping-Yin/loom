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

test('tech-stack headline with slashes is ok (no false no-vowel flag)', () => {
  assert.equal(assessAnswer('headline', 'HTML/CSS/JS developer').level, 'ok');
});

test('CJK short answers are not over-penalized', () => {
  assert.equal(assessAnswer('name', '李明').level, 'ok');
  assert.equal(assessAnswer('headline', '金融学生').level, 'ok');
  assert.equal(assessAnswer('summary', '应届计算机毕业生，做数据小工具。').level, 'ok');
});

test('a long all-consonant token is still bad (no-vowel branch)', () => {
  assert.equal(assessAnswer('summary', 'bcdfghjk').level, 'bad');
});

test('per-field MIN_LEN flags too-short answers as weak', () => {
  // highlight MIN_LEN is 8; 'built' (5) is under it
  assert.equal(assessAnswer('highlight', 'built').level, 'weak');
  // work_description MIN_LEN is 8; 'ok' (2) is under it
  assert.equal(assessAnswer('work_description', 'ok').level, 'weak');
});

test('hyphen/dot/colon tech stacks are not no-vowel-flagged (FIX C)', () => {
  assert.equal(assessAnswer('headline', 'ML-DL-NLP engineer').level, 'ok');
  assert.equal(assessAnswer('headline', 'HTML-CSS-JS').level, 'ok');
  // …but a genuine consonant run still fails
  assert.equal(assessAnswer('summary', 'bcdfghjk').level, 'bad');
});
