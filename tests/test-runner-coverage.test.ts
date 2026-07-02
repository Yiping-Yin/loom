import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const script = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts['test:contracts'];

test('test:contracts collects every test in tests/ via a glob, not a hand-maintained list', () => {
  assert.equal(script, 'tsx --test tests/*.test.*');
});

test('no test-like file in tests/ escapes the glob', () => {
  const escapees = fs
    .readdirSync('tests')
    .filter((f) => /\.(ts|tsx|mjs|js)$/.test(f))
    .filter((f) => /(test|spec|render|contract)/i.test(f))
    .filter((f) => !/\.test\.(ts|tsx|mjs|js)$/.test(f))
    .filter((f) => !['helpers.ts', 'setup.ts'].includes(f));
  assert.deepEqual(escapees, []);
});
