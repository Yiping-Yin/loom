import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function walk(relativePath: string): string[] {
  const abs = path.join(repoRoot, relativePath);
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRelative = path.join(relativePath, entry.name);
    out.push(childRelative);
    if (entry.isDirectory()) {
      out.push(...walk(childRelative));
    }
  }
  return out;
}

test('Panel detail no longer falls back to static placeholder panels or fake weft provenance', () => {
  const sourceText = read('app/PanelDetailClient.tsx');

  assert.doesNotMatch(sourceText, /const PANELS: Record<string, PanelDetail>/);
  assert.doesNotMatch(sourceText, /source pending/);
  assert.doesNotMatch(sourceText, /This panel has not yet settled\./);
  assert.doesNotMatch(sourceText, /It may still be ripening, or it was never drawn\./);
  assert.match(sourceText, /No held panel matches this route\./);
});

test('repo no longer carries shadow source routes with a \" 2\" suffix', () => {
  const shadowEntries = ['app', 'components', 'lib', 'tests']
    .flatMap((root) => walk(root))
    .filter((entry) => /(^|\/)[^/]+ 2($|\/)/.test(entry));

  assert.deepEqual(shadowEntries, []);
});
