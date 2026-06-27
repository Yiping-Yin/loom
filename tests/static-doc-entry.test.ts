import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('static-export-safe doc route exists for native source reading', () => {
  assert.ok(fs.existsSync(path.join(repoRoot, 'app/doc/page.tsx')));
  assert.ok(fs.existsSync(path.join(repoRoot, 'app/DocClient.tsx')));
});

test('native ContentView rewrites source-doc bundle navigations onto /doc?href=', () => {
  const source = read('macos-app/Loom/Sources/ContentView.swift');

  assert.match(source, /flatDocPathIfNeeded/);
  assert.match(source, /components\.path = "\/doc"/);
  assert.match(source, /URLQueryItem\(name: "href", value: relative\)/);
  assert.match(source, /url\.host == "bundle"/);
  assert.match(source, /let routed = Self\.flatDocPathIfNeeded\(relative\)/);
  assert.match(source, /if routed != relative, let target = Self\.bundleURL\(for: relative\)/);
});

test('native ContentView keeps static-export fallback shells for path-based panel and pursuit urls', () => {
  const source = read('macos-app/Loom/Sources/ContentView.swift');
  const exportScript = read('scripts/build-static-export.mjs');

  assert.match(source, /if path\.hasPrefix\("\/panel\/"\), path\.count > "\/panel\/"\.count/);
  assert.match(source, /URLQueryItem\(name: "panelId", value: id\)/);
  assert.match(source, /if path\.hasPrefix\("\/pursuit\/"\), path\.count > "\/pursuit\/"\.count/);
  assert.match(source, /URLQueryItem\(name: "pursuitId", value: id\)/);
  assert.match(exportScript, /'app\/panel\/\[id\]'/);
  assert.match(exportScript, /'app\/pursuit\/\[id\]'/);
});

