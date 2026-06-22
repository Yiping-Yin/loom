import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';

// CSS Modules / plain CSS imports: return a no-op proxy so className lookups
// resolve to strings during render.
const cssProxy = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : '') });
require.extensions['.css'] = (m: { exports: unknown }) => {
  m.exports = { __esModule: true, default: cssProxy };
};

function render(node: React.ReactElement): string {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server') as {
    renderToStaticMarkup: (node: React.ReactElement) => string;
  };
  return renderToStaticMarkup(node);
}

const { EditorErrorBoundary } = require('../app/digital-me/EditorErrorBoundary') as {
  EditorErrorBoundary: React.ComponentClass<{ children: React.ReactNode }, { hasError: boolean }>;
};

test('EditorErrorBoundary renders children when there is no error', () => {
  const html = render(
    <EditorErrorBoundary>
      <p>the editor</p>
    </EditorErrorBoundary>,
  );
  assert.match(html, /the editor/);
  assert.doesNotMatch(html, /Couldn/);
});

test('getDerivedStateFromError flips the boundary into its error state', () => {
  const next = (EditorErrorBoundary as unknown as {
    getDerivedStateFromError: () => { hasError: boolean };
  }).getDerivedStateFromError();
  assert.deepEqual(next, { hasError: true });
});

test('EditorErrorBoundary shows the quiet fallback + a way back once errored', () => {
  // Drive the boundary into its error state, then render it: a throwing child
  // would set this state via getDerivedStateFromError at runtime.
  class Forced extends (EditorErrorBoundary as React.ComponentClass<
    { children: React.ReactNode },
    { hasError: boolean }
  >) {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: true };
    }
  }
  const html = render(
    <Forced>
      <p>should be hidden</p>
    </Forced>,
  );
  // Quiet copy, no alarm.
  assert.match(html, /Couldn.+open this document/);
  // The crashing editor is not rendered.
  assert.doesNotMatch(html, /should be hidden/);
  // A way back to Digital Me.
  assert.match(html, /<a[^>]*href="\/digital-me"[^>]*>[\s\S]*Digital Me/);
  // role=alert so AT announces the fallback.
  assert.match(html, /role="alert"/);
});

test('DigitalMeGate wraps the edit-mode DraftClient in the boundary', () => {
  const gate = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'app/digital-me/DigitalMeGate.tsx'),
    'utf8',
  );
  assert.match(gate, /import \{ EditorErrorBoundary \} from '\.\/EditorErrorBoundary'/);
  assert.match(gate, /<EditorErrorBoundary>[\s\S]*<DraftClient[\s\S]*<\/EditorErrorBoundary>/);
});
