/**
 * Async local port over the IndexedDB trace store (Phase 4). Writes are SILENT
 * (traceStore.put/deleteOne don't emit learning-changed) so the sync engine's own
 * writes never re-trigger a sync.
 */
import { traceStore } from '../trace/store';
import type { Trace } from '../trace/types';
import type { AsyncCollectionLocalPort } from './async-collection-sync';
import { readTombstones, clearTombstone } from './tombstone-log';

export const TRACE_TOMBSTONES_KEY = 'loom.traces.tombstones.v1';

export function traceLocalPort(): AsyncCollectionLocalPort<Trace> {
  return {
    list: async () => (await traceStore.getAll()).map((t) => ({ id: t.id, value: t, updatedAt: t.updatedAt || 0 })),
    upsert: async (_id, value) => { await traceStore.put(value); },
    remove: async (id) => { await traceStore.deleteOne(id); },
    listTombstones: async () => readTombstones(TRACE_TOMBSTONES_KEY),
    clearTombstone: async (id) => { clearTombstone(TRACE_TOMBSTONES_KEY, id); },
  };
}
