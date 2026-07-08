import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('native url scheme exposes direct panel and pursuit detail endpoints', () => {
  // Post-partition homes (the payload builders live on LoomWebView.Coordinator).
  const handler = read('macos-app/Loom/Sources/App/Runtime/LoomURLSchemeHandler.swift');
  const contentView = read('macos-app/Loom/Sources/App/Runtime/LoomWebView.swift');

  assert.match(handler, /if requestURL\.host == "native"/);
  assert.match(handler, /case panel/);
  assert.match(handler, /case pursuit/);
  assert.match(handler, /case panels/);
  assert.match(handler, /case pursuits/);
  assert.match(handler, /case soan/);
  assert.match(handler, /case weaves/);
  assert.match(handler, /case recents/);
  assert.match(handler, /case "panels\.json"/);
  assert.match(handler, /case "pursuits\.json"/);
  assert.match(handler, /case "soan\.json"/);
  assert.match(handler, /case "weaves\.json"/);
  assert.match(handler, /case "recents\.json"/);
  assert.match(handler, /(?:ContentView|LoomWebView)\.Coordinator\.buildPanelPayload\(id: target\.id\)/);
  assert.match(handler, /(?:ContentView|LoomWebView)\.Coordinator\.buildPursuitPayload\(id: target\.id\)/);
  assert.match(handler, /(?:ContentView|LoomWebView)\.Coordinator\.buildPanelsPayload\(\)/);
  assert.match(handler, /(?:ContentView|LoomWebView)\.Coordinator\.buildPursuitsPayload\(\)/);
  assert.match(handler, /(?:ContentView|LoomWebView)\.Coordinator\.buildSoanPayload\(\)/);
  assert.match(handler, /(?:ContentView|LoomWebView)\.Coordinator\.buildWeavesPayload\(\)/);
  assert.match(handler, /(?:ContentView|LoomWebView)\.Coordinator\.buildRecentRecordsPayload\(\)/);

  assert.match(contentView, /static func buildPanelPayload\(id: String\) -> \[String: Any\]\?/);
  assert.match(contentView, /static func buildPursuitPayload\(id: String\) -> \[String: Any\]\?/);
});

test('detail clients prefer direct native endpoints and keep mirror fallback', () => {
  // (recents/pursuits/weaves/soan record clients retired in web-retirement
  // 6/7 — only the panel detail path still ships on a live page.)
  const panelDetail = read('app/PanelDetailClient.tsx');
  const panels = read('lib/loom-panel-records.ts');

  assert.match(panelDetail, /loom:\/\/native\/panel\/\$\{encodeURIComponent\(id\)\}\.json/);
  assert.match(panelDetail, /async function loadPanelDetail\(id: string\): Promise<PanelDetail \| null>/);
  assert.match(panelDetail, /return loadStoredPanelById\(id\);/);
  assert.match(panelDetail, /loadPanelRecords/);
  assert.doesNotMatch(panelDetail, /readLoomMirror/);

  assert.match(panels, /loom:\/\/native\/panels\.json/);
  assert.match(panels, /async function loadPanelRecords\(\): Promise<LoomPanelRecord\[]>/);
  assert.match(panels, /return readStoredPanelRecords\(\);/);

});
