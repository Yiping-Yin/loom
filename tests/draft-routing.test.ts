import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { draftStubTarget, selectDraftById } from '../lib/new-loom/draft-routing';

function parse(url: string) {
  const [pathname, query = ''] = url.split('?');
  return { path: pathname, params: new URLSearchParams(query) };
}

test('draftStubTarget maps ?d=<id> to /studio?edit=<id>', () => {
  const { path: pathname, params } = parse(draftStubTarget('?d=doc1'));
  assert.equal(pathname, '/studio');
  assert.equal(params.get('edit'), 'doc1');
  assert.equal(params.get('d'), null);
});

test('draftStubTarget defaults to edit=new when no d, preserving other params', () => {
  const { path: pathname, params } = parse(draftStubTarget('?draftType=ai-answer&ref=lecture'));
  assert.equal(pathname, '/studio');
  assert.equal(params.get('edit'), 'new');
  assert.equal(params.get('draftType'), 'ai-answer');
  assert.equal(params.get('ref'), 'lecture');
});

test('draftStubTarget handles empty search', () => {
  assert.equal(draftStubTarget(''), '/studio?edit=new');
});

test('selectDraftById finds by id, returns null for new/missing', () => {
  const recs = [
    { id: 'a', title: 'A', body: '', references: [], createdAt: '', updatedAt: '2' },
    { id: 'b', title: 'B', body: '', references: [], createdAt: '', updatedAt: '1' },
  ] as any;
  assert.equal(selectDraftById(recs, 'b')?.id, 'b');
  assert.equal(selectDraftById(recs, 'new'), null);
  assert.equal(selectDraftById(recs, 'missing'), null);
  assert.equal(selectDraftById([], 'a'), null);
});

test('/draft page.tsx is a client redirect stub using draftStubTarget', () => {
  const stub = fs.readFileSync(path.resolve(__dirname, '../app/draft/page.tsx'), 'utf8');
  assert.match(stub, /'use client'/);
  assert.match(stub, /draftStubTarget/);
  assert.doesNotMatch(stub, /DraftClient/);
});

test('/studio page.tsx is the first-class Studio editor route', () => {
  const page = fs.readFileSync(path.resolve(__dirname, '../app/studio/page.tsx'), 'utf8');
  const gate = fs.readFileSync(path.resolve(__dirname, '../app/studio/StudioGate.tsx'), 'utf8');
  assert.match(page, /StudioGate/);
  assert.match(page, /Suspense/);
  assert.match(gate, /useSearchParams/);
  assert.match(gate, /DraftClient/);
  assert.match(gate, /searchParams\.get\('edit'\).*searchParams\.get\('d'\).*'new'/s);
});
