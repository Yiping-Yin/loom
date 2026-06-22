import assert from 'node:assert/strict';
import test from 'node:test';

import { safeHref } from '../lib/profile/safe-href';

// ── Allowed schemes / forms are kept verbatim ───────────────────────────────

test('safeHref keeps http, https, and mailto', () => {
  assert.equal(safeHref('http://example.com'), 'http://example.com');
  assert.equal(safeHref('https://example.com/path?q=1#frag'), 'https://example.com/path?q=1#frag');
  assert.equal(safeHref('mailto:a@b.com'), 'mailto:a@b.com');
  // Scheme casing is irrelevant to the allowlist; value is kept as written.
  assert.equal(safeHref('HTTPS://Example.com'), 'HTTPS://Example.com');
});

test("safeHref keeps the app's loom:// scheme", () => {
  // loom:// is the app's internal source/navigation scheme; draft references and
  // source tiles cite sources via it, so it must survive the allowlist.
  assert.equal(safeHref('loom://s/econ'), 'loom://s/econ');
  assert.equal(safeHref('loom://artifact/42?q=1'), 'loom://artifact/42?q=1');
  // Scheme casing is irrelevant to the allowlist.
  assert.equal(safeHref('LOOM://s/econ'), 'LOOM://s/econ');
});

test('safeHref keeps relative and in-page hrefs', () => {
  assert.equal(safeHref('/works'), '/works');
  assert.equal(safeHref('/about#profile-links'), '/about#profile-links');
  assert.equal(safeHref('#section'), '#section');
  assert.equal(safeHref('./local'), './local');
  assert.equal(safeHref('../up'), '../up');
  // A bare relative path with a colon in a later segment is not a scheme.
  assert.equal(safeHref('path/to:thing'), 'path/to:thing');
});

test('safeHref trims surrounding whitespace before deciding', () => {
  assert.equal(safeHref('   https://example.com  '), 'https://example.com');
});

// ── Dangerous schemes are dropped ───────────────────────────────────────────

test('safeHref drops javascript:, data:, vbscript:, file:, ftp:', () => {
  assert.equal(safeHref('javascript:alert(1)'), '');
  assert.equal(safeHref('JavaScript:alert(1)'), '');
  assert.equal(safeHref('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(safeHref('vbscript:msgbox(1)'), '');
  assert.equal(safeHref('file:///etc/passwd'), '');
  assert.equal(safeHref('ftp://example.com/file'), '');
});

test('safeHref defeats control-char-obfuscated schemes', () => {
  // Embedded tab/newline/CR inside the scheme — browsers strip these, so we must
  // too, then reject the resulting javascript: scheme.
  assert.equal(safeHref('java\tscript:alert(1)'), '');
  assert.equal(safeHref('java\nscript:alert(1)'), '');
  assert.equal(safeHref('java\rscript:alert(1)'), '');
  assert.equal(safeHref('  jav\tascript:alert(1)'), '');
  // Leading control char (NUL) before the scheme.
  assert.equal(safeHref('\x00javascript:alert(1)'), '');
  // A real leading space is also trimmed, then the scheme is rejected.
  assert.equal(safeHref(' javascript:alert(1)'), '');
});

test('safeHref drops scheme-relative and empty/garbage input', () => {
  assert.equal(safeHref('//evil.com'), '');
  assert.equal(safeHref(''), '');
  assert.equal(safeHref('   '), '');
  assert.equal(safeHref(undefined), '');
  // Non-string input (defensive — type system should prevent this).
  assert.equal(safeHref(123 as unknown as string), '');
});
