import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

test('AI key missing banner does not render on the identity homepage', () => {
  const source = readFileSync(resolve('components/AiKeyMissingBanner.tsx'), 'utf8');

  assert.match(source, /pathname === ['"]\/['"]/);
  assert.match(source, /identity homepage/i);
});
