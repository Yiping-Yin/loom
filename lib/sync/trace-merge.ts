/**
 * Append-only trace merge (Phase 4 core). Merging two devices' copies of one trace
 * must UNION their event logs (events are append-only and have no stable id, so we
 * dedup by a stable serialization), take the higher-updatedAt copy's mutable
 * metadata, union childIds, and recompute derived fields from the merged events.
 * Pure + idempotent: mergeTrace(a, a) ≡ a after sort/dedup.
 */
import type { Trace, TraceEvent } from '../trace/types';
import { recomputeTrace } from '../trace/store';
import { stableStringify } from './stable-stringify';

export function mergeTraceEvents(a: TraceEvent[], b: TraceEvent[]): TraceEvent[] {
  const seen = new Set<string>();
  const out: TraceEvent[] = [];
  for (const event of [...a, ...b]) {
    const key = stableStringify(event);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }
  out.sort((x, y) => x.at - y.at);
  return out;
}

/** Effective metadata stamp: a metadata-only edit advances metaUpdatedAt (not the
 * event-derived updatedAt), so LWW resolves on the max of the two. */
function metaStamp(t: Trace): number {
  return Math.max(t.updatedAt, t.metaUpdatedAt ?? 0);
}

export function mergeTrace(local: Trace, remote: Trace): Trace {
  // Mutable metadata: last-write-wins by the effective stamp, tie -> local. childIds
  // is mutable membership (a child can be removed), so it follows the LWW winner via
  // the spread below — NOT a blind union, which would resurrect a removed child.
  const meta = metaStamp(remote) > metaStamp(local) ? remote : local;
  // Event tombstones union across devices, so a deletion made on either side sticks.
  const deletedEventKeys = Array.from(new Set([
    ...(local.deletedEventKeys ?? []),
    ...(remote.deletedEventKeys ?? []),
  ]));
  const tombstoned = new Set(deletedEventKeys);
  const events = mergeTraceEvents(local.events, remote.events)
    .filter((event) => !tombstoned.has(stableStringify(event)));
  const merged: Trace = {
    ...meta,
    id: local.id,
    deletedEventKeys: deletedEventKeys.length ? deletedEventKeys : undefined,
    events,
  };
  // Derived fields (createdAt/updatedAt/visitCount/mastery/...) from the merged events.
  return recomputeTrace(merged);
}

/**
 * Stable change-detection key for a trace's SYNC-canonical state. Excludes derived
 * fields — especially `mastery`, which recomputeTrace decays by wall-clock Date.now()
 * and would otherwise make every sync see a "change" and re-push forever. updatedAt
 * is compared separately by the engine, so it's excluded too.
 */
export function traceSyncKey(t: Trace): string {
  const {
    mastery: _m, visitCount: _v, totalDurationMs: _d, createdAt: _c, updatedAt: _u,
    crystallizedSummary: _cs, crystallizedAt: _ca, ...canonical
  } = t;
  return stableStringify(canonical);
}
