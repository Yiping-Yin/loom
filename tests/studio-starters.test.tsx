import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(repoRoot, p), 'utf8');

test('StudioStarters is the calm empty-state entry to the Studio', () => {
  const src = read('app/draft/StudioStarters.tsx');
  // Headline + single guidance hint (clean, minimal copy).
  assert.match(src, /Add to your Digital Me/);
  assert.match(src, /Pick a place to start/);
  // Four friendly starters, no jargon type names.
  assert.match(src, /A piece of experience/);
  assert.match(src, /A project/);
  assert.match(src, /An idea/);
  assert.match(src, /Something else/);
  assert.doesNotMatch(src, /Course Note|Portfolio Case Study|Product Story|About Section|OUTPUT/);
  // "just start writing" escape hatch + the start callback.
  assert.match(src, /just start writing/);
  assert.match(src, /onStart\(/);
  // Keyboard-operable starters (buttons, not bare divs).
  assert.match(src, /<button/);
  // Maps starters to real output types behind the scenes.
  assert.match(src, /portfolio-case-study/);
  assert.match(src, /product-story/);
});
