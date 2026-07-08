import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

test('product-wide light theme is opt-in per content surface (data-surface-theme)', () => {
  const globals = read('app/globals.css');
  const toggle = read('components/SurfaceThemeToggle.tsx');

  // The canonical light token block lives in globals.css, gated on the body attribute
  // (NOT a global default), with the proven spacesuit-white ground.
  assert.match(globals, /body\[data-surface-theme='light'\]/);
  assert.match(globals, /#edeae3/i);
  // The dark photographic field + cosmic overlays are switched off in light so the
  // white stays clean (the lesson from the Education theme).
  assert.match(globals, /--deep-space-field:\s*none/);
  assert.match(globals, /data-surface-theme='light'\] \.loom-grain/);
  assert.match(globals, /data-surface-theme='light'\] \.loom-vignette/);

  // The toggle sets/removes the attribute on <body> and persists the choice, so the
  // attribute exists ONLY while a content surface is mounted (cosmic pages never carry
  // it). The unmount cleanup is what keeps light from leaking onto the dark art pages.
  assert.match(toggle, /dataset\.surfaceTheme/);
  assert.match(toggle, /loom\.surface\.theme/);
  assert.match(toggle, /delete document\.body\.dataset\.surfaceTheme/);
});

// (Studio surface-theme contract retired with app/draft — web Studio/Draft
// died in the 2026-07-08 web retirement; the shared toggle contract above
// still guards the mechanism.)
