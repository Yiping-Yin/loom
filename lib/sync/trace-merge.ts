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

export function mergeTrace(local: Trace, remote: Trace): Trace {
  // Mutable metadata: last-write-wins by updatedAt, tie -> local.
  const meta = remote.updatedAt > local.updatedAt ? remote : local;
  const merged: Trace = {
    ...meta,
    id: local.id,
    childIds: Array.from(new Set([...local.childIds, ...remote.childIds])),
    events: mergeTraceEvents(local.events, remote.events),
  };
  // Derived fields (createdAt/updatedAt/visitCount/mastery/...) from the merged events.
  return recomputeTrace(merged);
}
