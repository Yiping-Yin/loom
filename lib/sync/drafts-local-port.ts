/**
 * CollectionLocalPort over the Studio block-documents store (loom.new.drafts.v1)
 * plus a companion tombstone log. Reuses the existing draft-storage read/mutate
 * helpers; SSR-safe and quota-safe, mirroring local-store-port.ts.
 */
import type { CollectionLocalPort, CollectionItem, CollectionTombstone } from './collection-sync';
import { listDrafts, upsertDraftRecordById, removeDraftById, browserDraftStorage } from '../new-loom/draft-storage';
import type { StudioDraft } from './draft-mapper';

export const DRAFTS_TOMBSTONES_KEY = 'loom.new.drafts.tombstones.v1';

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage ?? null; } catch { return null; }
}

function readTombstones(key: string): CollectionTombstone[] {
  try {
    const raw = ls()?.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is CollectionTombstone =>
        !!t && typeof (t as CollectionTombstone).id === 'string' && Number.isFinite((t as CollectionTombstone).deletedAt),
    );
  } catch {
    return [];
  }
}

function writeTombstones(key: string, tombs: CollectionTombstone[]): void {
  try { ls()?.setItem(key, JSON.stringify(tombs)); } catch { /* quota */ }
}

export function draftsLocalPort(): CollectionLocalPort<StudioDraft> {
  return {
    list: (): CollectionItem<StudioDraft>[] => {
      const adapter = browserDraftStorage();
      if (!adapter) return [];
      return listDrafts(adapter).map((draft) => ({
        id: draft.id,
        value: draft,
        updatedAt: Date.parse(draft.updatedAt) || 0,
      }));
    },
    upsert: (_id, value) => { upsertDraftRecordById(value); },
    remove: (id) => { removeDraftById(id); },
    listTombstones: () => readTombstones(DRAFTS_TOMBSTONES_KEY),
    clearTombstone: (id) =>
      writeTombstones(DRAFTS_TOMBSTONES_KEY, readTombstones(DRAFTS_TOMBSTONES_KEY).filter((t) => t.id !== id)),
  };
}
