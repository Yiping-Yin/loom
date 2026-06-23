/**
 * Orchestrates one profile sync: fetch remote, LWW-merge against local, then
 * apply remote OR push local. Local-first — any failure leaves local untouched
 * and reports 'error' (never throws to the UI).
 */
import { pickWinner } from './merge';
import { rowToProfile, profileToRow } from './profile-mapper';
import type { ProfileGateway } from './profile-gateway';
import type { ProfileLocalPort } from './local-store-port';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export class ProfileSync {
  constructor(private gateway: ProfileGateway, private port: ProfileLocalPort) {}

  async syncOnce(userId: string): Promise<SyncStatus> {
    try {
      const row = await this.gateway.fetch(userId);
      const remote = row ? rowToProfile(row) : null;
      const localProfile = this.port.read();
      const local = localProfile
        ? { value: localProfile, updatedAt: this.port.getLocalUpdatedAt() }
        : null;
      const remoteStamped = remote ? { value: remote.profile, updatedAt: remote.updatedAt } : null;

      const winner = pickWinner(local, remoteStamped);
      if (!winner) return 'synced';

      if (winner.source === 'remote') {
        this.port.write(winner.value);
        this.port.setLocalUpdatedAt(winner.updatedAt);
      } else {
        await this.gateway.upsert(profileToRow(winner.value, userId, winner.updatedAt));
      }
      return 'synced';
    } catch {
      return 'error';
    }
  }
}
