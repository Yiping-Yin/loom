import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('canonical fixed detail route exists for panels', () => {
  assert.ok(fs.existsSync(path.join(repoRoot, 'app/panel/page.tsx')));
  assert.ok(fs.existsSync(path.join(repoRoot, 'app/panel/[id]/page.tsx')));
});

test('shuttle deep-links to canonical fixed detail routes', () => {
  const shuttle = read('macos-app/Loom/Sources/ShuttleView.swift');

  assert.match(shuttle, /userInfo: \["path": "\/pursuit\/\\\(encode\(p\.id\)\)"\]/);
  assert.match(shuttle, /userInfo: \["path": "\/panel\/\\\(encode\(p\.id\)\)"\]/);
  assert.doesNotMatch(shuttle, /\/pursuit\?pursuitId=/);
  assert.doesNotMatch(shuttle, /\/panel\?panelId=/);
});
