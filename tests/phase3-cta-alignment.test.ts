import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('source-first empty states and legacy routes point to canonical Sources or Draft', () => {
  const soan = read('app/soan/page.tsx');
  const constellation = read('app/constellation/page.tsx');
  const patternsRoute = read('app/patterns/page.tsx');
  const pursuitsRoute = read('app/pursuits/page.tsx');
  const coworksRoute = read('app/coworks/page.tsx');
  const collectionRoute = read('app/collection/page.tsx');
  const patterns = read('app/PatternsClient.tsx');
  const pursuits = read('app/PursuitsClient.tsx');
  const docClient = read('app/DocClient.tsx');

  assert.match(soan, /redirect\('\/draft\?view=board'\)/);
  assert.match(coworksRoute, /redirect\('\/draft'\)/);
  assert.match(constellation, /redirect\('\/sources#reader-notes'\)/);
  assert.match(patternsRoute, /redirect\('\/sources#reader-notes'\)/);
  assert.match(pursuitsRoute, /redirect\('\/sources'\)/);
  assert.match(collectionRoute, /redirect\('\/sources'\)/);
  assert.match(patterns, /Open Sources/);
  assert.match(patterns, /href="\/sources"/);
  assert.match(patterns, /ArrowRight/);
  assert.match(pursuits, /Open Sources/);
  assert.match(pursuits, /href="\/sources"/);
  assert.match(pursuits, /ArrowRight/);
  assert.match(docClient, /Open Sources/);
  assert.match(docClient, /<Link href="\/sources" className="loom-empty-state-action">/);
  assert.match(docClient, /ArrowRight/);
});

test('panel source meta routes wiki and sources to their phase-2 homes', () => {
  const selectors = read('lib/panel/selectors.ts');

  assert.match(selectors, /collectionLabel: 'LLM Wiki'/);
  assert.match(selectors, /collectionHref: '\/llm-wiki'/);
  assert.match(selectors, /collectionLabel: category\?\.label \?\? 'Sources'/);
  assert.match(selectors, /collectionHref: `\/knowledge\/\$\{match\[1\]\}`/);
});
