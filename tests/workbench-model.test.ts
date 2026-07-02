import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bookOrder,
  deriveEntries,
  filterPalette,
  heartbeat,
  manuscriptAt,
  openPositions,
  pageGaps,
  paletteIndex,
  passBoundaries,
} from '../app/workbench/workbenchModel';
import type { NativeReflectionCase, NativeTraceRecord } from '../app/reflection/nativeReflectionSnapshot';
import { SWIFT_REFERENCE_EPOCH_MS } from '../app/reflection/nativeReflectionSnapshot';

function record(overrides: Partial<NativeTraceRecord>): NativeTraceRecord {
  return {
    schemaVersion: 1,
    id: Math.random().toString(36).slice(2),
    kind: 'captured',
    traceType: 'selected word',
    sourceAnchor: 'Week 1 Notes.pdf, page 2',
    focus: 'vocabulary',
    text: 'trajectories',
    evidence: [{ label: 'anchor precision', value: 'file+page' }],
    legacyItem: 'Captured …',
    ...overrides,
  };
}

function learningCase(records: NativeTraceRecord[]): NativeReflectionCase {
  return {
    id: 'case-1',
    title: 'Market Making · FINS3666',
    project: 'Learning pass',
    status: 'Reading',
    updatedAt: '10:00',
    summary: '',
    tags: [],
    sources: [],
    steps: [{ id: 'input', title: 'Input', subtitle: '', items: [] }],
    messages: [],
    traceRecords: records,
  };
}

test('workbench: records derive manuscript entries with book order and page gaps', () => {
  const entries = deriveEntries(
    learningCase([
      record({ sourceAnchor: 'Notes.pdf, page 7', text: 'later idea' }),
      record({ sourceAnchor: 'Notes.pdf, page 2', text: 'early idea' }),
      record({ sourceAnchor: 'Notes.pdf', text: 'unanchored', focus: 'user meaning' }),
    ]),
  );
  const ordered = bookOrder(entries);
  assert.deepEqual(ordered.map((entry) => entry.text), ['early idea', 'later idea', 'unanchored']);
  assert.deepEqual(pageGaps(entries), [{ from: 3, to: 6 }]);
});

test('workbench: a correction supersedes the prior meaning on the same anchor', () => {
  const entries = deriveEntries(
    learningCase([
      record({ focus: 'user meaning', text: 'an IOC is a faster limit order', sourceAnchor: 'Notes.pdf, page 3' }),
      record({ focus: 'correction', text: 'correction: an IOC never rests in the book', sourceAnchor: 'Notes.pdf, page 3' }),
    ]),
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0]!.kind, 'correction');
  assert.equal(entries[0]!.supersededText, 'an IOC is a faster limit order');
  assert.equal(entries[0]!.text, 'an IOC never rests in the book');
});

test('workbench: open questions carry their close condition and count as positions', () => {
  const entries = deriveEntries(
    learningCase([
      record({ focus: 'question', text: 'Why does the spread widen at open? closes when: I reproduce it from ticks' }),
    ]),
  );
  assert.equal(openPositions(entries).length, 1);
  assert.equal(entries[0]!.openCondition, 'I reproduce it from ticks');
});

test('workbench: time travel replays the manuscript by commit and pass boundary', () => {
  const entries = deriveEntries(
    learningCase([
      record({ text: 'first', sourceAnchor: 'Notes.pdf, page 1' }),
      record({ text: 'second', sourceAnchor: 'Notes.pdf, page 9' }),
      record({ focus: 'question', text: 'open one?', sourceAnchor: 'Notes.pdf, page 9' }),
    ]),
  );
  assert.equal(manuscriptAt(entries, 1).length, 1);
  assert.equal(manuscriptAt(entries, 3).length, 3);
  assert.deepEqual(passBoundaries(entries), { firstPassEnd: 2, total: 3 });
});

test('workbench: heartbeat counts only today, split captures vs meanings', () => {
  const now = new Date('2026-07-03T10:00:00');
  const todaySwift = (now.getTime() - SWIFT_REFERENCE_EPOCH_MS) / 1000;
  const yesterdaySwift = todaySwift - 86_400;
  const beat = heartbeat(
    [
      learningCase([
        record({ createdAt: todaySwift }),
        record({ createdAt: todaySwift, focus: 'user meaning' }),
        record({ createdAt: yesterdaySwift }),
      ]),
    ],
    now,
  );
  assert.deepEqual(beat, { captures: 1, meanings: 1 });
});

test('workbench: the palette indexes projects, entries, and jumpable pages', () => {
  const cases = [
    learningCase([record({ text: 'adverse selection', sourceAnchor: 'Notes.pdf, page 12' })]),
  ];
  const items = paletteIndex(cases);
  assert.ok(items.some((item) => item.type === 'project'));
  assert.ok(items.some((item) => item.type === 'entry' && item.title.includes('adverse selection')));
  const jump = filterPalette(items, 'adverse');
  assert.ok(jump.some((item) => item.type === 'page' && item.page === 12));
});
