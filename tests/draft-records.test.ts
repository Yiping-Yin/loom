import assert from 'node:assert/strict';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');

function repoImport(modulePath: string) {
  const absolutePath = path.join(repoRoot, modulePath);
  return import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`);
}

function createMemoryStorage() {
  const items = new Map<string, string>();

  return {
    getItem(key: string) {
      return items.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      items.set(key, value);
    },
    removeItem(key: string) {
      items.delete(key);
    },
  };
}

test('Draft records save and load the latest published answer record', async () => {
  const records = await repoImport('lib/new-loom/draft-records.ts') as {
    NEW_LOOM_DRAFT_RECORDS_KEY?: string;
    buildDraftRecord?: (input: {
      title: string;
      answer: string;
      sourceLabels: string[];
      sourceHrefs: string[];
      draftUrl: string;
      status: 'drafting' | 'previewed' | 'published';
      now?: () => string;
    }) => {
      id: string;
      title: string;
      answer: string;
      sourceLabels: string[];
      sourceHrefs: string[];
      draftUrl: string;
      status: 'drafting' | 'previewed' | 'published';
      updatedAt: string;
    };
    saveDraftRecord?: (record: unknown, input?: { storage?: ReturnType<typeof createMemoryStorage> }) => boolean;
    loadDraftRecords?: (input?: { storage?: ReturnType<typeof createMemoryStorage> }) => unknown[];
    loadDraftRecordById?: (
      id: string,
      input?: { storage?: ReturnType<typeof createMemoryStorage> },
    ) => unknown | null;
    loadLatestDraftRecord?: (input?: { storage?: ReturnType<typeof createMemoryStorage> }) => {
      title: string;
      status: string;
      updatedAt: string;
    } | null;
    draftRecordDetailHref?: (record: { id: string }) => string;
  };
  const storage = createMemoryStorage();

  assert.equal(records.NEW_LOOM_DRAFT_RECORDS_KEY, 'loom.new.draft-records.v1');
  assert.equal(typeof records.buildDraftRecord, 'function');
  assert.equal(typeof records.saveDraftRecord, 'function');
  assert.equal(typeof records.loadDraftRecords, 'function');
  assert.equal(typeof records.loadDraftRecordById, 'function');
  assert.equal(typeof records.loadLatestDraftRecord, 'function');
  assert.equal(typeof records.draftRecordDetailHref, 'function');

  const olderRecord = records.buildDraftRecord!({
    title: 'Phillips Curve answer draft',
    answer: 'The Phillips Curve gives the short-run trade-off.',
    sourceLabels: ['Lecture 8 Notes'],
    sourceHrefs: ['/knowledge/unsw/econ3202'],
    draftUrl: '/draft?draftType=ai-answer&ref=lecture',
    status: 'drafting',
    now: () => '2026-06-03T00:00:00.000Z',
  });
  const latestRecord = records.buildDraftRecord!({
    title: 'Concavity answer draft',
    answer: 'Concavity gives the optimisation answer a stable interpretation.',
    sourceLabels: ['Problem Set 02.pdf'],
    sourceHrefs: ['/knowledge/unsw/econ3202/ps02'],
    draftUrl: '/draft?draftType=ai-answer&ref=problem-set',
    status: 'previewed',
    now: () => '2026-06-04T00:00:00.000Z',
  });

  assert.equal(records.saveDraftRecord!(olderRecord, { storage }), true);
  assert.equal(records.saveDraftRecord!(latestRecord, { storage }), true);

  const loadedRecords = records.loadDraftRecords!({ storage });
  const latestLoadedRecord = records.loadLatestDraftRecord!({ storage });

  assert.equal(loadedRecords.length, 2);
  assert.deepEqual(latestLoadedRecord, latestRecord);
  assert.deepEqual(records.loadDraftRecordById!(latestRecord.id, { storage }), latestRecord);
  assert.equal(records.draftRecordDetailHref!(latestRecord), `/drafts/${latestRecord.id}`);
});
