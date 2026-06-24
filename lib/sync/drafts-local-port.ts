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
      // NOTE: a non-ISO/corrupt updatedAt parses to NaN -> 0; only pre-corrupted
      // local storage can reach this (normal writes emit valid ISO), accepted as
      // a low-risk edge. Synced writes below stamp a valid ISO, so they converge.
      return listDrafts(adapter).map((draft) => ({
        id: draft.id,
        value: draft,
        updatedAt: Date.parse(draft.updatedAt) || 0,
      }));
    },
    upsert: (_id, value, updatedAt) => {
      // Persist the engine-resolved timestamp as the record's own stamp so the
      // embedded updatedAt and the remote column can't drift apart after a pull.
      upsertDraftRecordById({ ...value, updatedAt: new Date(updatedAt).toISOString() });
    },
    remove: (id) => { removeDraftById(id); },
    listTombstones: () => readTombstones(DRAFTS_TOMBSTONES_KEY),
    clearTombstone: (id) =>
      writeTombstones(DRAFTS_TOMBSTONES_KEY, readTombstones(DRAFTS_TOMBSTONES_KEY).filter((t) => t.id !== id)),
  };
}
