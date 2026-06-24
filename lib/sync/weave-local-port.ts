/**
 * Async local port over the IndexedDB weave store (Phase 4). LWW collection.
 */
import { weaveStore } from '../weave/store';
import type { Weave } from '../weave/types';
import type { AsyncCollectionLocalPort } from './async-collection-sync';
import { readTombstones, clearTombstone, WEAVE_TOMBSTONES_KEY } from './tombstone-log';

export function weaveLocalPort(): AsyncCollectionLocalPort<Weave> {
  return {
    list: async () => (await weaveStore.getAll()).map((w) => ({ id: w.id, value: w, updatedAt: w.updatedAt || 0 })),
    upsert: async (_id, value) => { await weaveStore.put(value); },
    remove: async (id) => { await weaveStore.deleteSilent(id); },
    listTombstones: async () => readTombstones(WEAVE_TOMBSTONES_KEY),
    clearTombstone: async (id) => { clearTombstone(WEAVE_TOMBSTONES_KEY, id); },
  };
}
