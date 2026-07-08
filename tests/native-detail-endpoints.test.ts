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
  const panelDetail = read('app/PanelDetailClient.tsx');
  const recents = read('lib/loom-recent-records.ts');
  const panels = read('lib/loom-panel-records.ts');
  const pursuitRecords = read('lib/loom-pursuit-records.ts');
  const weaveRecords = read('lib/loom-weave-records.ts');
  const soanRecords = read('lib/loom-soan-records.ts');

  assert.match(panelDetail, /loom:\/\/native\/panel\/\$\{encodeURIComponent\(id\)\}\.json/);
  assert.match(panelDetail, /async function loadPanelDetail\(id: string\): Promise<PanelDetail \| null>/);
  assert.match(panelDetail, /return loadStoredPanelById\(id\);/);
  assert.match(panelDetail, /loadPanelRecords/);
  assert.doesNotMatch(panelDetail, /readLoomMirror/);

  assert.match(recents, /loom:\/\/native\/recents\.json/);
  assert.match(recents, /async function loadRecentRecords\(\): Promise<LoomRecentRecord\[]>/);
  assert.match(recents, /return readStoredRecentRecords\(\);/);

  assert.match(panels, /loom:\/\/native\/panels\.json/);
  assert.match(panels, /async function loadPanelRecords\(\): Promise<LoomPanelRecord\[]>/);
  assert.match(panels, /return readStoredPanelRecords\(\);/);

  assert.match(pursuitRecords, /loom:\/\/native\/pursuits\.json/);
  assert.match(pursuitRecords, /async function loadPursuitRecords\(\): Promise<LoomPursuitRecord\[]>/);
  assert.match(pursuitRecords, /return readStoredPursuitRecords\(\);/);

  assert.match(weaveRecords, /loom:\/\/native\/weaves\.json/);
  assert.match(weaveRecords, /async function loadWeaveRecords\(\): Promise<LoomWeaveRecord\[]>/);
  assert.match(weaveRecords, /return readStoredWeaveRecords\(\);/);

  assert.match(soanRecords, /loom:\/\/native\/soan\.json/);
  assert.match(soanRecords, /async function loadSoanPayload\(\): Promise<LoomSoanPayload>/);
  assert.match(soanRecords, /return readStoredSoanPayload\(\);/);
});
