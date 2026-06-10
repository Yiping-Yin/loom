import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

test('Next dev config allows the 127.0.0.1 origin used by the in-app browser', () => {
  const config = fs.readFileSync(path.join(repoRoot, 'next.config.mjs'), 'utf8');

  assert.match(config, /allowedDevOrigins/);
  assert.match(config, /'127\.0\.0\.1'/);
});
