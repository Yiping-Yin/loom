import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = ['app/PanelDetailClient.tsx'];

test('native-backed web surfaces use native record helpers instead of raw localStorage reads', () => {
  for (const relativePath of TARGETS) {
    const sourceText = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(
      sourceText,
      /from '..\/lib\/loom-(panel|pursuit|soan|weave|recent)-records'|from '\.\.\/lib\/loom-(panel|pursuit|soan|weave|recent)-records'/,
      `${relativePath} should import a typed native record helper`,
    );
    assert.doesNotMatch(
      sourceText,
      /readLoomMirror/,
      `${relativePath} should not read mirror payloads directly`,
    );
    assert.doesNotMatch(
      sourceText,
      /localStorage\.getItem\('loom\.(panels|pursuits|soan|weaves)\.v1'\)/,
      `${relativePath} should not read loom record state directly from localStorage`,
    );
  }
});

test('shared mirror helper stays read-only plus subscription-only', () => {
  const sourceText = fs.readFileSync(path.join(repoRoot, 'lib/loom-mirror-store.ts'), 'utf8');

  assert.doesNotMatch(sourceText, /export function writeLoomMirror/);
  assert.doesNotMatch(sourceText, /localStorage\.setItem\(storageKey, JSON\.stringify\(value\)\)/);
});
