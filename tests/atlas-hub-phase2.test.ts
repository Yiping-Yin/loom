import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('/sources becomes the canonical source-library home', () => {
  const sourcesPage = read('app/sources/page.tsx');

  assert.match(sourcesPage, /KnowledgeHomeClient/);
  assert.match(sourcesPage, /getSourceLibraryGroups/);
  assert.match(sourcesPage, /title: 'Sources · Loom'/);
});

test('/knowledge redirects to /sources as a compatibility alias', () => {
  const knowledgePage = read('app/knowledge/page.tsx');

  assert.match(knowledgePage, /redirect\('\/sources'\)/);
});
