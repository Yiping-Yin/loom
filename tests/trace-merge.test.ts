import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeTrace, mergeTraceEvents, traceSyncKey } from '../lib/sync/trace-merge';
import { stableStringify } from '../lib/sync/stable-stringify';
import type { Trace, TraceEvent } from '../lib/trace/types';

const ev = (at: number, content: string): TraceEvent => ({ kind: 'note', content, at });
const base = (over: Partial<Trace> = {}): Trace => ({
  id: 't1', kind: 'free', title: 'T', parentId: null, childIds: [], events: [],
  createdAt: 0, updatedAt: 0, visitCount: 0, totalDurationMs: 0, mastery: 0, ...over,
});
const contents = (t: Trace) => t.events.map((e) => (e as { content: string }).content);

test('events: union dedups exact dupes, keeps disjoint, sorts by at', () => {
  const out = mergeTraceEvents([ev(2, 'a'), ev(1, 'b')], [ev(1, 'b'), ev(3, 'c')]);
  assert.deepEqual(out.map((e) => (e as { content: string }).content), ['b', 'a', 'c']);
  assert.equal(out.length, 3);
});

test('mergeTrace unions events from both devices', () => {
  const m = mergeTrace(base({ events: [ev(1, 'a')], updatedAt: 10 }), base({ events: [ev(2, 'b')], updatedAt: 5 }));
  assert.equal(m.events.length, 2);
});

test('metadata LWW by metaUpdatedAt (edit recency, not event recency); tie -> local', () => {
  assert.equal(mergeTrace(base({ title: 'L', metaUpdatedAt: 5 }), base({ title: 'R', metaUpdatedAt: 9 })).title, 'R');
  assert.equal(mergeTrace(base({ title: 'L', metaUpdatedAt: 5 }), base({ title: 'R', metaUpdatedAt: 5 })).title, 'L');
});

test('a pure event append does NOT revert a metadata edit made on the other device', () => {
  const local = base({ title: 'Renamed', metaUpdatedAt: 1010, events: [ev(1000, 'old')] });
  const remote = base({ title: 'Untitled', events: [ev(2000, 'new')] }); // newer EVENT, no metadata edit
  const m = mergeTrace(local, remote);
  assert.equal(m.title, 'Renamed'); // the metadata edit wins despite remote's newer event
  assert.equal(m.events.length, 2); // events still union
});

test('childIds follows the LWW winner (not a blind union — avoids resurrecting a removed child)', () => {
  const m = mergeTrace(base({ childIds: ['a'], metaUpdatedAt: 5 }), base({ childIds: ['b', 'c'], metaUpdatedAt: 9 }));
  assert.deepEqual(m.childIds, ['b', 'c']); // remote's metadata edit is newer -> its childIds win
});

test('traceSyncKey ignores volatile mastery but reflects real (event) changes', () => {
  const a = base({ events: [ev(1, 'x')], mastery: 0.5 });
  const b = base({ events: [ev(1, 'x')], mastery: 0.1 });
  assert.equal(traceSyncKey(a), traceSyncKey(b)); // mastery drift is NOT a change
  const c = base({ events: [ev(1, 'x'), ev(2, 'y')] });
  assert.notEqual(traceSyncKey(a), traceSyncKey(c)); // a real event change IS
});

test('derived recompute: updatedAt = max event at, createdAt = min', () => {
  const m = mergeTrace(base({ events: [ev(100, 'a')] }), base({ events: [ev(50, 'b'), ev(300, 'c')] }));
  assert.equal(m.updatedAt, 300);
  assert.equal(m.createdAt, 50);
});

test('idempotent: mergeTrace(a,a) keeps events + childIds stable', () => {
  const a = mergeTrace(base({ events: [ev(1, 'x'), ev(2, 'y')], childIds: ['c'] }), base({ events: [ev(2, 'y')] }));
  const aa = mergeTrace(a, a);
  assert.deepEqual(aa.events, a.events);
  assert.deepEqual(aa.childIds, a.childIds);
});

test('deletedEventKeys subtracts a unioned event (a user-deleted event does NOT resurrect)', () => {
  const gone = ev(2, 'b');
  const local = base({ events: [ev(1, 'a')], deletedEventKeys: [stableStringify(gone)] });
  const remote = base({ events: [ev(1, 'a'), gone] }); // remote still holds the deleted event
  const m = mergeTrace(local, remote);
  assert.deepEqual(m.events.map((e) => (e as { content: string }).content), ['a']); // stays deleted
  assert.ok(m.deletedEventKeys?.includes(stableStringify(gone)));
});

test('metaUpdatedAt lets a metadata edit win even when event-derived updatedAt ties', () => {
  const local = base({ events: [ev(5, 'x')], title: 'L' }); // no metadata edit
  const remote = base({ events: [ev(5, 'x')], title: 'R', metaUpdatedAt: 100 }); // remote retitled/pinned
  const m = mergeTrace(local, remote);
  assert.equal(m.title, 'R'); // remote's metadata edit wins despite the event-derived updatedAt tie
});

test('commutative event set regardless of arg order', () => {
  const l = base({ events: [ev(1, 'a')] });
  const r = base({ events: [ev(2, 'b')] });
  assert.deepEqual(contents(mergeTrace(l, r)).sort(), contents(mergeTrace(r, l)).sort());
});
