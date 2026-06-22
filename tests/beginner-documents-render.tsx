import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const cssProxy = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : '') });
require.extensions['.css'] = (m: { exports: unknown }) => {
  m.exports = { __esModule: true, default: cssProxy };
};

function render(node: React.ReactElement) {
  Object.assign(globalThis, { React });
  const { renderToStaticMarkup } = require('react-dom/server');
  return renderToStaticMarkup(node) as string;
}
function visibleText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
}

test('toStudioDocumentSummary maps a draft record, defaulting an empty title', () => {
  const { toStudioDocumentSummary } = require('../app/digital-me/BeginnerDocuments');
  const s = toStudioDocumentSummary({
    id: 'd1',
    title: '  ',
    body: 'one two three',
    references: [{ href: 'loom://s', label: 'S' }],
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T10:00:00.000Z',
  });
  assert.equal(s.id, 'd1');
  assert.equal(s.title, 'Untitled document');
  assert.equal(s.sourceCount, 1);
  assert.equal(s.wordCount, 3);
  assert.equal(s.updatedAt, '2026-06-22T10:00:00.000Z');
  assert.equal(s.includedInDigitalMe, undefined);
});

test('toStudioDocumentSummary carries the includedInDigitalMe curation flag', () => {
  const { toStudioDocumentSummary } = require('../app/digital-me/BeginnerDocuments');
  const included = toStudioDocumentSummary({
    id: 'd2',
    title: 'Included note',
    body: 'one two',
    references: [],
    includedInDigitalMe: true,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T10:00:00.000Z',
  });
  assert.equal(included.includedInDigitalMe, true);
});

test('BeginnerDocuments renders document cards that open /draft?d=<id>', () => {
  const { BeginnerDocuments } = require('../app/digital-me/BeginnerDocuments');
  const html = render(
    <BeginnerDocuments
      documents={[
        { id: 'd1', title: 'Quant note', sourceCount: 2, wordCount: 120, updatedAt: '2026-06-22T10:00:00.000Z' },
      ]}
    />,
  );
  assert.match(html, /href="\/digital-me\?edit=d1"/);
  assert.match(html, /href="\/digital-me\?edit=new"/); // the "New document" header action
  const text = visibleText(html);
  assert.match(text, /Studio/);
  assert.match(text, /Quant note/);
  assert.match(text, /Grounded by 2 sources/);
  assert.match(text, /120 words/);
});

test('BeginnerDocuments marks included docs with a quiet "In Digital Me" chip', () => {
  const { BeginnerDocuments } = require('../app/digital-me/BeginnerDocuments');
  const html = render(
    <BeginnerDocuments
      documents={[
        { id: 'in', title: 'Included', sourceCount: 1, wordCount: 10, updatedAt: '2026-06-22T10:00:00.000Z', includedInDigitalMe: true },
        { id: 'out', title: 'Excluded', sourceCount: 1, wordCount: 10, updatedAt: '2026-06-22T10:00:00.000Z' },
      ]}
    />,
  );
  // The chip appears exactly once — only on the included card.
  const matches = html.match(/In Digital Me/g) ?? [];
  assert.equal(matches.length, 1);
  assert.match(visibleText(html), /In Digital Me/);
});

test('BeginnerDocuments shows an empty-state CTA when there are no documents', () => {
  const { BeginnerDocuments } = require('../app/digital-me/BeginnerDocuments');
  const html = render(<BeginnerDocuments documents={[]} />);
  assert.match(html, /href="\/digital-me\?edit=new"/);
  assert.match(visibleText(html), /Start a document/);
});
