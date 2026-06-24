import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftMapper } from '../lib/sync/draft-mapper';
import { draftRecordMapper } from '../lib/sync/draft-record-mapper';

const studio = (over: Record<string, unknown> = {}) => ({
  id: 'a',
  title: 'A',
  body: 'b',
  references: [] as Array<{ label: string; href: string }>,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...over,
});

test('studio mapper round-trips a valid record', () => {
  const r = studio();
  assert.deepEqual(draftMapper.fromData(draftMapper.toData(r)), r);
});

test('studio mapper drops an unsafe reference href on ingest', () => {
  const dirty = studio({
    references: [
      { label: 'x', href: 'javascript:alert(1)' },
      { label: 'ok', href: '/docs/a' },
    ],
  });
  const out = draftMapper.fromData(dirty)!;
  assert.equal(out.references.length, 1);
  assert.equal(out.references[0]?.href, '/docs/a');
});

test('studio mapper returns null for garbage', () => {
  assert.equal(draftMapper.fromData({ nope: true }), null);
  assert.equal(draftMapper.fromData(null), null);
});

test('answer-record mapper round-trips and rejects garbage', () => {
  const r = {
    id: 'r1',
    title: 'T',
    answer: 'A',
    sourceLabels: [],
    sourceHrefs: [],
    draftUrl: '/digital-me',
    status: 'drafting' as const,
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
  assert.deepEqual(draftRecordMapper.fromData(draftRecordMapper.toData(r)), r);
  assert.equal(draftRecordMapper.fromData({ bad: 1 }), null);
});

test('answer-record mapper drops an unsafe sourceHref', () => {
  const dirty = {
    id: 'r2',
    title: 'T',
    answer: 'A',
    sourceLabels: ['a', 'b'],
    sourceHrefs: ['data:text/html,evil', '/sources/ok'],
    draftUrl: '/digital-me',
    status: 'drafting' as const,
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
  const out = draftRecordMapper.fromData(dirty)!;
  assert.deepEqual(out.sourceHrefs, ['/sources/ok']);
});

test('answer-record mapper keeps label/href pairs aligned when a middle href is dropped', () => {
  const dirty = {
    id: 'r3',
    title: 'T',
    answer: 'A',
    sourceLabels: ['Spec PDF', 'Evil link', 'Notes'],
    sourceHrefs: ['/spec.pdf', 'javascript:alert(1)', '/notes.md'],
    draftUrl: '/digital-me',
    status: 'drafting' as const,
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
  const out = draftRecordMapper.fromData(dirty)!;
  // The unsafe pair ("Evil link") is dropped whole; the rest stay index-aligned.
  assert.deepEqual(out.sourceHrefs, ['/spec.pdf', '/notes.md']);
  assert.deepEqual(out.sourceLabels, ['Spec PDF', 'Notes']);
});
