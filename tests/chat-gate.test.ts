/**
 * tests/chat-gate.test.ts
 *
 * Unit tests for the pure chat-onboarding gate decision (decideChatGate) and the
 * step-key helper. No stubs needed — lib/onboarding/chat-gate.ts is a plain
 * module (no 'use client', no React/CSS/next), so it imports directly.
 *
 * Run via: npm run test:contracts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { decideChatGate, stepKey, type ConvoStep } from '../lib/onboarding/chat-gate';

test('decideChatGate: a bad free-text answer nudges with the step key + a hint', () => {
  const step: ConvoStep = { id: 'name' };
  const gate = decideChatGate(step, 'asdfgh', new Set());
  assert.equal(gate.nudge, true);
  if (gate.nudge) {
    assert.equal(gate.key, 'name');
    assert.ok(gate.hint, 'a nudge must carry a coaching hint');
    assert.match(gate.hint!, /doesn't look like a name/i);
  }
});

test('decideChatGate: a step already in `reasked` passes through (never trap the user)', () => {
  const step: ConvoStep = { id: 'name' };
  const reasked = new Set([stepKey(step)]); // 'name'
  const gate = decideChatGate(step, 'asdfgh', reasked);
  assert.equal(gate.nudge, false);
});

test('decideChatGate: a skip answer on a free-text step passes through', () => {
  const step: ConvoStep = { id: 'summary' };
  const gate = decideChatGate(step, 'skip', new Set());
  assert.equal(gate.nudge, false);
});

test('decideChatGate: an ok answer passes through', () => {
  const step: ConvoStep = { id: 'name' };
  const gate = decideChatGate(step, 'Lin Wei', new Set());
  assert.equal(gate.nudge, false);
});

test('decideChatGate: a non-free-text step never nudges, whatever the answer', () => {
  // review has no AnswerField mapping
  assert.equal(decideChatGate({ id: 'review' }, 'asdfgh', new Set()).nudge, false);
  // year ranges are non-free-text too
  assert.equal(
    decideChatGate({ id: 'edu_years', entryIdx: 0 }, 'asdfgh', new Set()).nudge,
    false,
  );
});

test('stepKey: same id with different entryIdx yields distinct keys', () => {
  assert.equal(stepKey({ id: 'edu_institution', entryIdx: 0 }), 'edu_institution:0');
  assert.equal(stepKey({ id: 'edu_institution', entryIdx: 1 }), 'edu_institution:1');
  assert.notEqual(
    stepKey({ id: 'edu_institution', entryIdx: 0 }),
    stepKey({ id: 'edu_institution', entryIdx: 1 }),
  );
  // No-entryIdx steps key on the bare id.
  assert.equal(stepKey({ id: 'name' }), 'name');
});
