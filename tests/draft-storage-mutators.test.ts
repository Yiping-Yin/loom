import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  upsertDraftRecordById,
  removeDraftById,
  listDrafts,
  isDraftRecord,
  NEW_LOOM_DRAFTS_KEY,
  type DraftStorageAdapter,
} from '../lib/new-loom/draft-storage';
import {
  saveDraftRecord,
  loadDraftRecords,
  removeDraftRecordById,
  isDraftAnswerRecord,
  buildDraftRecord,
} from '../lib/new-loom/draft-records';
import { browserLocalStorage } from '../lib/browser-storage';

function memAdapter(): DraftStorageAdapter {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } };
}

const rec = (id: string, title: string) => ({
  id,
  title,
  body: 'b',
  references: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
});

test('isDraftRecord validates shape', () => {
  assert.equal(isDraftRecord(rec('a', 'A')), true);
  assert.equal(isDraftRecord({ id: 1 }), false);
});

test('upsertDraftRecordById inserts then replaces by id', () => {
  const adapter = memAdapter();
  upsertDraftRecordById(rec('a', 'A'), { adapter });
  upsertDraftRecordById(rec('a', 'A2'), { adapter });
  upsertDraftRecordById(rec('b', 'B'), { adapter });
  const drafts = listDrafts(adapter, NEW_LOOM_DRAFTS_KEY);
  assert.equal(drafts.length, 2);
  assert.equal(drafts.find((d) => d.id === 'a')?.title, 'A2');
});

test('removeDraftById removes one', () => {
  const adapter = memAdapter();
  upsertDraftRecordById(rec('a', 'A'), { adapter });
  upsertDraftRecordById(rec('b', 'B'), { adapter });
  removeDraftById('a', { adapter });
  const drafts = listDrafts(adapter, NEW_LOOM_DRAFTS_KEY);
  assert.deepEqual(drafts.map((d) => d.id), ['b']);
});

// jsdom-free localStorage stub for the draft-records (BrowserStorageAdapter) path
function withWindow(fn: () => void) {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  };
  try { fn(); } finally { delete (globalThis as Record<string, unknown>).window; }
}

test('isDraftAnswerRecord validates the answer-record shape', () => {
  const r = buildDraftRecord({ title: 'T', answer: 'A', sourceLabels: [], sourceHrefs: [], draftUrl: '/digital-me', status: 'drafting' });
  assert.equal(isDraftAnswerRecord(r), true);
  assert.equal(isDraftAnswerRecord({ id: 'x' }), false);
});

test('removeDraftRecordById removes an answer record by id', () => {
  withWindow(() => {
    const storage = browserLocalStorage();
    const r = buildDraftRecord({ title: 'T', answer: 'A', sourceLabels: [], sourceHrefs: [], draftUrl: '/digital-me', status: 'drafting' });
    saveDraftRecord(r, { storage });
    assert.equal(loadDraftRecords({ storage }).length, 1);
    removeDraftRecordById(r.id, { storage });
    assert.equal(loadDraftRecords({ storage }).length, 0);
  });
});
