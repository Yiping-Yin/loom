import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Draft page is composed as a professional source-grounded workspace', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const globals = read('app/globals.css');

  assert.match(draftClient, /new-loom-draft__identity-rail/);
  assert.match(draftClient, /new-loom-draft__workspace/);
  assert.match(draftClient, /new-loom-draft__document-header/);
  assert.match(draftClient, /new-loom-draft__editor-shell/);
  assert.match(draftClient, /new-loom-draft__editor-toolbar/);
  assert.match(draftClient, /new-loom-draft__proof-strip/);
  assert.match(draftClient, /Answer grounded by/);
  assert.match(draftClient, /Publish answer preview/);
  assert.match(draftClient, /Provenance/);

  assert.match(
    globals,
    /\.new-loom-draft\s*\{[\s\S]*grid-template-columns:\s*minmax\(14rem,\s*17rem\)\s+minmax\(0,\s*1fr\)\s+minmax\(21rem,\s*27rem\)/,
  );
  assert.match(globals, /\.new-loom-draft__identity-rail\s*\{/);
  assert.match(globals, /\.new-loom-draft__document-header\s*\{/);
  assert.match(globals, /\.new-loom-draft__editor-shell\s*\{/);
  assert.match(globals, /\.new-loom-draft__proof-strip\s*\{/);
});
