import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// Regression (r5 overhaul): the "Include in Digital Me" toggle
// (.new-loom-draft__reference-action, aria-pressed) lost its a11y affordances.
// The control is live-styled in app/draft/draft-evidence-desk.module.css (the
// `.surface :global(...)` scope wins the cascade over app/globals.css), so the
// three contracts below must hold THERE — the cascade winner / live source.
const repoRoot = path.resolve(__dirname, '..');
const moduleCss = fs.readFileSync(
  path.join(repoRoot, 'app/draft/draft-evidence-desk.module.css'),
  'utf8',
);

test('the include toggle has a visible aria-pressed="true" state in signature cyan', () => {
  // A pressed-state rule scoped to the toggle, using the identity signature
  // cyan (never a hardcoded hex). Mirrors the __type-button pressed pattern.
  const pressed = new RegExp(
    String.raw`\.surface\s+:global\(\.new-loom-draft__reference-action\[aria-pressed="true"\]\)\s*\{[^}]*\}`,
  ).exec(moduleCss);
  assert.ok(pressed, 'a pressed-state rule for the include toggle must exist in the module CSS');
  assert.match(
    pressed![0],
    /var\(--signature-cyan/,
    'the pressed state must read in the signature cyan token (no hardcoded hex)',
  );
});

test('the include toggle has its own :focus-visible ring on the signature cyan', () => {
  const focus = new RegExp(
    String.raw`\.surface\s+:global\(\.new-loom-draft__reference-action:focus-visible\)\s*\{[^}]*\}`,
  ).exec(moduleCss);
  assert.ok(focus, 'a :focus-visible rule for the include toggle must exist in the module CSS');
  assert.match(focus![0], /outline:/, 'the focus state must paint an outline ring');
  assert.match(
    focus![0],
    /var\(--signature-cyan/,
    'the focus ring must use the signature cyan token',
  );
});

test('the include toggle transform is guarded by prefers-reduced-motion', () => {
  // The control carries a :active translate; under reduced-motion the transform
  // must be neutralised. The reference-action selector must appear inside a
  // prefers-reduced-motion block that drops transition/transform.
  const rmBlock = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g;
  let guarded = false;
  for (const match of moduleCss.matchAll(rmBlock)) {
    if (/\.new-loom-draft__reference-action/.test(match[1])) {
      guarded = true;
    }
  }
  assert.ok(
    guarded,
    'the include toggle must be listed in a prefers-reduced-motion block (transform/transition neutralised)',
  );
});
