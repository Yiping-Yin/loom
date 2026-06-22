import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';

// An untrusted reference href (e.g. carried in via an imported/merged source) must
// not be able to inject an unsafe scheme into the /draft surface's link sinks. The
// project's safeHref allowlist neutralizes javascript:/data:/vbscript:/… while keeping
// http(s), mailto, the app's loom:// scheme, and relative app paths working. These
// contracts pin that the draft cite/reference render sites route hrefs through it.

const cssProxy = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : '') });
require.extensions['.css'] = (m: { exports: unknown }) => {
  m.exports = { __esModule: true, default: cssProxy };
};

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server');
  return renderToStaticMarkup(node) as string;
}

const repoRoot = path.resolve(__dirname, '..');
function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('draft cite block neutralizes an unsafe href but keeps loom:// and relative app paths', () => {
  const { DraftBlockEditor } = require('../app/draft/DraftBlockEditor');
  const html = render(
    <DraftBlockEditor
      blocks={[
        // Poisoned source merged in from an untrusted import.
        { id: 'a', kind: 'cite', href: 'javascript:alert(document.cookie)', label: 'Poisoned', excerpt: 'x' },
        // data: is NOT blocked by React's built-in href guard, so the allowlist must catch it.
        { id: 'd', kind: 'cite', href: 'data:text/html,<script>alert(1)</script>', label: 'Data URI', excerpt: 'w' },
        // The app's internal source scheme must survive.
        { id: 'b', kind: 'cite', href: 'loom://s/econ', label: 'Econ notes', excerpt: 'y' },
        // A relative app path must survive.
        { id: 'c', kind: 'cite', href: '/sources/3', label: 'Local', excerpt: 'z' },
      ]}
      onChange={() => {}}
    />,
  );
  // No unsafe scheme may reach the rendered <a href> sink.
  assert.doesNotMatch(html, /javascript:/i);
  assert.doesNotMatch(html, /data:text\/html/i);
  // Safe destinations are preserved verbatim so citations stay openable.
  assert.match(html, /href="loom:\/\/s\/econ"/);
  assert.match(html, /href="\/sources\/3"/);
});

test('DraftClient routes every reference/tile/provenance href through safeHref', () => {
  const src = read('app/draft/DraftClient.tsx');

  // The allowlist helper is imported.
  assert.match(src, /import \{ safeHref \} from '\.\.\/\.\.\/lib\/profile\/safe-href'/);

  // No raw href sink leaks an untrusted reference href into <a href={...}>.
  assert.doesNotMatch(src, /href=\{tile\.href\}/);
  assert.doesNotMatch(src, /href=\{realReference\.href\}/);
  assert.doesNotMatch(src, /href=\{match\.href\}/);

  // Both source-tile anchors, the reference link, and the provenance link wrap with safeHref.
  const tileSinks = src.match(/href=\{safeHref\(tile\.href\)/g) ?? [];
  assert.equal(tileSinks.length, 2, 'both source-tile anchors wrap tile.href with safeHref');
  assert.match(src, /href=\{safeHref\(realReference\.href\)/);
  assert.match(src, /href=\{safeHref\(match\.href\)/);
});
