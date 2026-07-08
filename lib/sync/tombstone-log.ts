/**
 * Shared local tombstone log for the async (IndexedDB) collection ports (Phase 4).
 * A small localStorage list of `{ id, deletedAt }` per store, so a delete propagates
 * to other devices before being confirmed-pushed. SSR-safe, quota-safe.
 */
// (Inlined when the cloud collection-sync layer was retired, 2026-07-08 —
// tombstones remain a purely local deletion log.)
export type AsyncCollectionTombstone = { id: string; deletedAt: number };

export const TRACE_TOMBSTONES_KEY = 'loom.traces.tombstones.v1';
export const PANEL_TOMBSTONES_KEY = 'loom.panels.tombstones.v1';
export const WEAVE_TOMBSTONES_KEY = 'loom.weaves.tombstones.v1';

function ls(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage ?? null; } catch { return null; }
}

/** Record a local delete so it propagates on the next sync. Dedup by id (max deletedAt). */
export function appendTombstone(key: string, id: string, deletedAt: number): void {
  try {
    const rest = readTombstones(key).filter((t) => t.id !== id);
    rest.push({ id, deletedAt });
    ls()?.setItem(key, JSON.stringify(rest));
  } catch { /* quota / SSR */ }
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
