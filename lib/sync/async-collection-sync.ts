/**
 * Async per-record collection sync (Phase 4). Like the Phase 3 CollectionSync
 * (union-of-ids reconciliation, soft-delete tombstones, local-first) but ASYNC
 * (IndexedDB ports return Promises) and parameterized by a per-record merge:
 *   - lwwMerge        → panels / weaves (last-write-wins)
 *   - trace event-union → traces (preserves append-only events from both devices)
 * Phase 1/2/3 sync code is untouched; this is a separate engine.
 */
import { pickWinner, type Stamped } from './merge';
import { stableStringify } from './stable-stringify';
import type { SyncStatus } from './profile-sync';

export type { SyncStatus } from './profile-sync';

export interface AsyncCollectionItem<T> { id: string; value: T; updatedAt: number; }
export interface AsyncCollectionTombstone { id: string; deletedAt: number; }

export interface AsyncCollectionLocalPort<T> {
  list(): Promise<AsyncCollectionItem<T>[]>;
  upsert(id: string, value: T, updatedAt: number): Promise<void>;
  remove(id: string): Promise<void>;
  listTombstones(): Promise<AsyncCollectionTombstone[]>;
  clearTombstone(id: string): Promise<void>;
}

export interface AsyncCollectionRow { id: string; data: unknown; deleted: boolean; updatedAt: number; }

export interface AsyncCollectionGateway {
  fetchAll(userId: string): Promise<AsyncCollectionRow[]>;
  upsert(userId: string, id: string, data: unknown, deleted: boolean, updatedAt: number): Promise<void>;
}

export interface AsyncCollectionMapper<T> { toData(value: T): unknown; fromData(data: unknown): T | null; }

export type RecordMerge<T> = (
  local: { value: T; updatedAt: number } | null,
  remote: { value: T; updatedAt: number } | null,
) => { value: T; updatedAt: number } | null;

/** Last-write-wins per record (tie -> local), wrapping the generic pickWinner. */
export function lwwMerge<T>(): RecordMerge<T> {
  return (local, remote) => {
    const winner = pickWinner(local as Stamped<T> | null, remote as Stamped<T> | null);
    return winner ? { value: winner.value, updatedAt: winner.updatedAt } : null;
  };
}

type Side<T> =
  | { kind: 'present'; value: T; updatedAt: number }
  | { kind: 'deleted'; updatedAt: number }
  | { kind: 'absent' };

export class AsyncCollectionSync<T> {
  constructor(
    private gateway: AsyncCollectionGateway,
    private port: AsyncCollectionLocalPort<T>,
    private mapper: AsyncCollectionMapper<T>,
    private mergeRecord: RecordMerge<T>,
    // Change-detection key. Default = stableStringify of the whole value (order-
    // independent). Traces pass a key that EXCLUDES wall-clock-derived fields
    // (mastery) so a converged trace stops re-pushing every sync.
    private keyOf: (value: T) => string = (value) => {
      try { return stableStringify(value); } catch { return ''; }
    },
  ) {}

  async syncOnce(userId: string): Promise<SyncStatus> {
    try {
      const rows = await this.gateway.fetchAll(userId);
      const local = new Map<string, AsyncCollectionItem<T>>();
      for (const item of await this.port.list()) local.set(item.id, item);
      const tombs = new Map<string, AsyncCollectionTombstone>();
      for (const tomb of await this.port.listTombstones()) tombs.set(tomb.id, tomb);
      const remote = new Map<string, AsyncCollectionRow>();
      for (const row of rows) remote.set(row.id, row);

      const ids = new Set<string>([...local.keys(), ...tombs.keys(), ...remote.keys()]);
      for (const id of ids) {
        await this.reconcile(userId, id, this.localSide(id, local, tombs), this.remoteSide(id, remote));
      }
      return 'synced';
    } catch {
      return 'error';
    }
  }

  private localSide(id: string, local: Map<string, AsyncCollectionItem<T>>, tombs: Map<string, AsyncCollectionTombstone>): Side<T> {
    const item = local.get(id);
    const tomb = tombs.get(id);
    if (tomb && item) {
      return tomb.deletedAt >= item.updatedAt
        ? { kind: 'deleted', updatedAt: tomb.deletedAt }
        : { kind: 'present', value: item.value, updatedAt: item.updatedAt };
    }
    if (tomb) return { kind: 'deleted', updatedAt: tomb.deletedAt };
    if (item) return { kind: 'present', value: item.value, updatedAt: item.updatedAt };
    return { kind: 'absent' };
  }

  private remoteSide(id: string, remote: Map<string, AsyncCollectionRow>): Side<T> {
    const row = remote.get(id);
    if (!row) return { kind: 'absent' };
    if (row.deleted) return { kind: 'deleted', updatedAt: row.updatedAt };
    const value = this.mapper.fromData(row.data);
    if (value === null) return { kind: 'absent' };
    return { kind: 'present', value, updatedAt: row.updatedAt };
  }

  private async reconcile(userId: string, id: string, local: Side<T>, remote: Side<T>): Promise<void> {
    // Both present -> custom merge (event-union for traces, LWW for panels/weaves).
    if (local.kind === 'present' && remote.kind === 'present') {
      const merged = this.mergeRecord(
        { value: local.value, updatedAt: local.updatedAt },
        { value: remote.value, updatedAt: remote.updatedAt },
      );
      if (!merged) return;
      const mergedKey = this.keyOf(merged.value);
      if (remote.updatedAt !== merged.updatedAt || this.keyOf(remote.value) !== mergedKey) {
        await this.gateway.upsert(userId, id, this.mapper.toData(merged.value), false, merged.updatedAt);
      }
      if (local.updatedAt !== merged.updatedAt || this.keyOf(local.value) !== mergedKey) {
        await this.port.upsert(id, merged.value, merged.updatedAt);
      }
      await this.port.clearTombstone(id);
      return;
    }

    // Otherwise: tombstone-LWW (identical to Phase 3). A delete is a delete; no merge.
    const ls: Stamped<Side<T>> | null = local.kind === 'absent' ? null : { value: local, updatedAt: local.updatedAt };
    const rs: Stamped<Side<T>> | null = remote.kind === 'absent' ? null : { value: remote, updatedAt: remote.updatedAt };
    const winner = pickWinner(ls, rs);
    if (!winner) return;
    const truth = winner.value;

    const remoteMatches =
      (truth.kind === 'present' && remote.kind === 'present' && remote.updatedAt === truth.updatedAt) ||
      (truth.kind === 'deleted' && remote.kind === 'deleted' && remote.updatedAt === truth.updatedAt);
    if (!remoteMatches) {
      if (truth.kind === 'present') await this.gateway.upsert(userId, id, this.mapper.toData(truth.value), false, truth.updatedAt);
      else if (truth.kind === 'deleted') await this.gateway.upsert(userId, id, null, true, truth.updatedAt);
    }

    if (truth.kind === 'present') {
      if (!(local.kind === 'present' && local.updatedAt === truth.updatedAt)) await this.port.upsert(id, truth.value, truth.updatedAt);
    } else if (truth.kind === 'deleted') {
      if (local.kind === 'present') await this.port.remove(id);
    }
    await this.port.clearTombstone(id);
  }
}
