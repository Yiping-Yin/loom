import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('atlas quiet-scene layout contract stays text-only for contract tests', () => {
  const atlasSource = read('app/knowledge/KnowledgeHomeStatic.tsx');
  const quietSceneSource = read('components/QuietScene.tsx');
  const css = read('app/globals.css');

  assert.match(quietSceneSource, /export function QuietScene\(/);
  assert.match(quietSceneSource, /export function QuietSceneColumn\(/);
  assert.match(quietSceneSource, /'atlas'/);
  assert.match(quietSceneSource, /loom-quiet-scene--\$\{tone\}/);
  assert.match(css, /\.loom-quiet-scene\b/);
  assert.match(css, /\.loom-quiet-scene__column\b/);
  assert.doesNotMatch(atlasSource, /guide-card|GuideCard/);
});

test('global CSS defines the quiet-scene width token and scene classes', () => {
  const css = read('app/globals.css');

  assert.match(css, /--quiet-scene-width/);
  assert.match(css, /\.loom-quiet-scene\b/);
  assert.match(css, /\.loom-quiet-scene__column\b/);
});

test('quiet-scene CSS stays page-neutral and keeps a viewport-height floor', () => {
  const css = read('app/globals.css');

  assert.match(css, /\.loom-quiet-scene\s*\{[\s\S]*min-height:\s*calc\(100vh -/);
  assert.match(css, /\.loom-quiet-scene::before[\s\S]*radial-gradient/);
  assert.doesNotMatch(css, /--quiet-scene-tint/);
});

test('today and patterns keep their current route-level shells', () => {
  const todaySource = read('app/today/TodayClient.tsx');
  const patternsSource = read('app/PatternsClient.tsx');

  // /today now uses styles.page (lit scene) for the standalone route and
  // loom-today--embedded only in the embedded variant.
  assert.match(todaySource, /styles\.page/);
  assert.match(todaySource, /loom-today--embedded/);
  assert.match(patternsSource, /className="loom-patterns"/);
});

test('atlas uses the shared quiet column and route clients avoid page-level guide cards', () => {
  const todaySource = read('app/today/TodayClient.tsx');
  const atlasSource = read('app/knowledge/KnowledgeHomeStatic.tsx');
  const quietSceneSource = read('components/QuietScene.tsx');
  const patternsSource = read('app/PatternsClient.tsx');

  assert.match(quietSceneSource, /QuietSceneColumn/);
  for (const source of [todaySource, atlasSource, patternsSource]) {
    assert.doesNotMatch(source, /guide-card|GuideCard/);
  }
});
