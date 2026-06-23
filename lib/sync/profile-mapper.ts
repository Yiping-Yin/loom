/**
 * Maps between the BeginnerProfile and the Postgres `profiles` row. Every
 * server→client ingest runs normalizeBeginnerProfile as the trust boundary
 * (caps fields, drops unsafe hrefs) — server data is never trusted raw.
 */
import { normalizeBeginnerProfile, type BeginnerProfile } from '../profile/beginner-profile';

export type ProfileRow = { user_id: string; data: unknown; updated_at: string };

export function profileToRow(profile: BeginnerProfile, userId: string, updatedAtMs: number): ProfileRow {
  return { user_id: userId, data: profile, updated_at: new Date(updatedAtMs).toISOString() };
}

export function rowToProfile(row: { data: unknown; updated_at: string }): { profile: BeginnerProfile; updatedAt: number } {
  const updatedAt = Date.parse(row.updated_at);
  return {
    profile: normalizeBeginnerProfile(row.data),
    updatedAt: Number.isNaN(updatedAt) ? 0 : updatedAt,
  };
}
