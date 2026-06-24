/**
 * Shared local tombstone log for the async (IndexedDB) collection ports (Phase 4).
 * A small localStorage list of `{ id, deletedAt }` per store, so a delete propagates
 * to other devices before being confirmed-pushed. SSR-safe, quota-safe.
 */
import type { AsyncCollectionTombstone } from './async-collection-sync';

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage ?? null; } catch { return null; }
}

export function readTombstones(key: string): AsyncCollectionTombstone[] {
  try {
    const raw = ls()?.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is AsyncCollectionTombstone =>
        !!t && typeof (t as AsyncCollectionTombstone).id === 'string' && Number.isFinite((t as AsyncCollectionTombstone).deletedAt),
    );
  } catch {
    return [];
  }
}

export function clearTombstone(key: string, id: string): void {
  try { ls()?.setItem(key, JSON.stringify(readTombstones(key).filter((t) => t.id !== id))); } catch { /* quota */ }
}
