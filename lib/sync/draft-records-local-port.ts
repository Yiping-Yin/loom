/**
 * CollectionLocalPort over the "AI answer" records store
 * (loom.new.draft-records.v1) plus a companion tombstone log. SSR-safe and
 * quota-safe, mirroring local-store-port.ts.
 */
import type { CollectionLocalPort, CollectionItem, CollectionTombstone } from './collection-sync';
import { loadDraftRecords, saveDraftRecord, removeDraftRecordById } from '../new-loom/draft-records';
import type { AnswerRecord } from './draft-record-mapper';

export const DRAFT_RECORDS_TOMBSTONES_KEY = 'loom.new.draft-records.tombstones.v1';

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

export function draftRecordsLocalPort(): CollectionLocalPort<AnswerRecord> {
  return {
    list: (): CollectionItem<AnswerRecord>[] =>
      loadDraftRecords().map((record) => ({
        id: record.id,
        value: record,
        updatedAt: Date.parse(record.updatedAt) || 0,
      })),
    upsert: (_id, value) => { saveDraftRecord(value); },
    remove: (id) => { removeDraftRecordById(id); },
    listTombstones: () => readTombstones(DRAFT_RECORDS_TOMBSTONES_KEY),
    clearTombstone: (id) =>
      writeTombstones(DRAFT_RECORDS_TOMBSTONES_KEY, readTombstones(DRAFT_RECORDS_TOMBSTONES_KEY).filter((t) => t.id !== id)),
  };
}
