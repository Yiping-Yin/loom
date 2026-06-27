import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

test('legacy panel detail route is a compatibility alias, not a placeholder shell generator', () => {
  const legacyPanel = read('app/panels/[id]/page.tsx');

  assert.doesNotMatch(legacyPanel, /export function generateStaticParams/);

  assert.match(legacyPanel, /router\.replace\(`\/panel\/\$\{encodeURIComponent\(id\)\}`\)/);
});
