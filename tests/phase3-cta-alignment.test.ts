import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('panel source meta routes wiki and sources to their phase-2 homes', () => {
  const selectors = read('lib/panel/selectors.ts');

  assert.match(selectors, /collectionLabel: 'LLM Wiki'/);
  assert.match(selectors, /collectionHref: '\/llm-wiki'/);
  assert.match(selectors, /collectionLabel: category\?\.label \?\? 'Sources'/);
  assert.match(selectors, /collectionHref: `\/knowledge\/\$\{match\[1\]\}`/);
});
