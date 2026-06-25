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

test('Studio (first content surface) opts into the light theme', () => {
  const draftClient = read('app/draft/DraftClient.tsx');
  const draftCss = read('app/draft/draft-evidence-desk.module.css');

  // The Studio top bar mounts the shared toggle.
  assert.match(draftClient, /SurfaceThemeToggle/);

  // The Studio re-points its few hardcoded-dark tokens for light mode (the rest of the
  // ramp flips via the global token override).
  assert.match(draftCss, /data-surface-theme='light'/);
  assert.match(draftCss, /--draft-glass-bg/);
});
