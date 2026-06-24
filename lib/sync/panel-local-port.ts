/**
 * Async local port over the IndexedDB panel store (Phase 4). LWW collection.
 */
import { panelStore } from '../panel/store';
import type { Panel } from '../panel/types';
import type { AsyncCollectionLocalPort } from './async-collection-sync';
import { readTombstones, clearTombstone } from './tombstone-log';

export const PANEL_TOMBSTONES_KEY = 'loom.panels.tombstones.v1';

export function panelLocalPort(): AsyncCollectionLocalPort<Panel> {
  return {
    list: async () => (await panelStore.getAll()).map((p) => ({ id: p.id, value: p, updatedAt: p.updatedAt || 0 })),
    upsert: async (_id, value) => { await panelStore.put(value); },
    remove: async (id) => { await panelStore.delete(id); },
    listTombstones: async () => readTombstones(PANEL_TOMBSTONES_KEY),
    clearTombstone: async (id) => { clearTombstone(PANEL_TOMBSTONES_KEY, id); },
  };
}
