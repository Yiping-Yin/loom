/**
 * Generic per-document collection sync: reconcile a local collection (with a
 * tombstone log) against per-row remote state by last-write-wins. Local-first —
 * any failure leaves local untouched and returns 'error'. Reverse-reuses the
 * generic pickWinner from merge.ts. Phase 1's singleton ProfileSync is untouched.
 */
import { pickWinner, type Stamped } from './merge';
import type { SyncStatus } from './profile-sync';

export type { SyncStatus } from './profile-sync';

export interface CollectionItem<T> { id: string; value: T; updatedAt: number; }
export interface CollectionTombstone { id: string; deletedAt: number; }

export interface CollectionLocalPort<T> {
  list(): CollectionItem<T>[];
  upsert(id: string, value: T, updatedAt: number): void;
  remove(id: string): void;
  listTombstones(): CollectionTombstone[];
  clearTombstone(id: string): void;
}

export interface CollectionRow { id: string; data: unknown; deleted: boolean; updatedAt: number; }

export interface CollectionGateway {
  fetchAll(userId: string): Promise<CollectionRow[]>;
  upsert(userId: string, id: string, data: unknown, deleted: boolean, updatedAt: number): Promise<void>;
}

export interface CollectionMapper<T> {
  toData(value: T): unknown;
  fromData(data: unknown): T | null;
}

type Side<T> =
  | { kind: 'present'; value: T; updatedAt: number }
  | { kind: 'deleted'; updatedAt: number }
  | { kind: 'absent' };

export class CollectionSync<T> {
  constructor(
    private gateway: CollectionGateway,
    private port: CollectionLocalPort<T>,
    private mapper: CollectionMapper<T>,
  ) {}

  async syncOnce(userId: string): Promise<SyncStatus> {
    try {
      const remoteRows = await this.gateway.fetchAll(userId);
      const local = new Map<string, CollectionItem<T>>();
      for (const it of this.port.list()) local.set(it.id, it);
      const tombs = new Map<string, CollectionTombstone>();
      for (const t of this.port.listTombstones()) tombs.set(t.id, t);
      const remote = new Map<string, CollectionRow>();
      for (const r of remoteRows) remote.set(r.id, r);

      const ids = new Set<string>([...local.keys(), ...tombs.keys(), ...remote.keys()]);
      for (const id of ids) {
        await this.reconcile(userId, id, this.localSide(id, local, tombs), this.remoteSide(id, remote));
      }
      return 'synced';
    } catch {
      return 'error';
    }
  }

  private localSide(
    id: string,
    local: Map<string, CollectionItem<T>>,
    tombs: Map<string, CollectionTombstone>,
  ): Side<T> {
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

  private remoteSide(id: string, remote: Map<string, CollectionRow>): Side<T> {
    const row = remote.get(id);
    if (!row) return { kind: 'absent' };
    if (row.deleted) return { kind: 'deleted', updatedAt: row.updatedAt };
    const value = this.mapper.fromData(row.data);
    if (value === null) return { kind: 'absent' };
    return { kind: 'present', value, updatedAt: row.updatedAt };
  }

  private async reconcile(userId: string, id: string, local: Side<T>, remote: Side<T>): Promise<void> {
    const ls: Stamped<Side<T>> | null = local.kind === 'absent' ? null : { value: local, updatedAt: local.updatedAt };
    const rs: Stamped<Side<T>> | null = remote.kind === 'absent' ? null : { value: remote, updatedAt: remote.updatedAt };
    const winner = pickWinner(ls, rs);
    if (!winner) return;
    const truth = winner.value;

    // Push remote to the winner FIRST so a thrown gateway error leaves local untouched.
    const remoteMatches =
      (truth.kind === 'present' && remote.kind === 'present' && remote.updatedAt === truth.updatedAt) ||
      (truth.kind === 'deleted' && remote.kind === 'deleted' && remote.updatedAt === truth.updatedAt);
    if (!remoteMatches) {
      if (truth.kind === 'present') {
        await this.gateway.upsert(userId, id, this.mapper.toData(truth.value), false, truth.updatedAt);
      } else if (truth.kind === 'deleted') {
        await this.gateway.upsert(userId, id, null, true, truth.updatedAt);
      }
    }

    // Bring local to the winner.
    if (truth.kind === 'present') {
      const localMatches = local.kind === 'present' && local.updatedAt === truth.updatedAt;
      if (!localMatches) this.port.upsert(id, truth.value, truth.updatedAt);
    } else if (truth.kind === 'deleted') {
      if (local.kind === 'present') this.port.remove(id);
    }

    this.port.clearTombstone(id);
  }
}
