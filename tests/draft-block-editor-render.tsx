import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const cssProxy = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : '') });
require.extensions['.css'] = (m: { exports: unknown }) => { m.exports = { __esModule: true, default: cssProxy }; };

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server');
  return renderToStaticMarkup(node) as string;
}

test('DraftBlockEditor renders text + code + cite blocks in order', () => {
  const { DraftBlockEditor } = require('../app/draft/DraftBlockEditor');
  const html = render(
    <DraftBlockEditor
      blocks={[
        { id: 'b1', kind: 'text', text: 'Hello world' },
        { id: 'b2', kind: 'code', text: 'print(1)', lang: 'python', source: 'strat.py' },
        { id: 'b3', kind: 'cite', href: '/s', label: 'Source A', excerpt: 'quote' },
      ]}
      onChange={() => {}}
    />,
  );
  assert.match(html, /Hello world/);
  assert.match(html, /print\(1\)/);
  assert.match(html, /Source A/);
  assert.match(html, /new-loom-draft__block/);
  // The cite block links to its source so the citation is openable.
  assert.match(html, /<a[^>]*href="\/s"[^>]*>[\s\S]*Source A/);
});
