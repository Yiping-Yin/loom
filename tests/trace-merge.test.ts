import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeTrace, mergeTraceEvents } from '../lib/sync/trace-merge';
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

test('metadata LWW by updatedAt (higher wins), tie -> local', () => {
  assert.equal(mergeTrace(base({ title: 'L', updatedAt: 5 }), base({ title: 'R', updatedAt: 9 })).title, 'R');
  assert.equal(mergeTrace(base({ title: 'L', updatedAt: 5 }), base({ title: 'R', updatedAt: 5 })).title, 'L');
});

test('childIds union', () => {
  const m = mergeTrace(base({ childIds: ['a', 'b'] }), base({ childIds: ['b', 'c'] }));
  assert.deepEqual([...m.childIds].sort(), ['a', 'b', 'c']);
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

test('commutative event set regardless of arg order', () => {
  const l = base({ events: [ev(1, 'a')] });
  const r = base({ events: [ev(2, 'b')] });
  assert.deepEqual(contents(mergeTrace(l, r)).sort(), contents(mergeTrace(r, l)).sort());
});
