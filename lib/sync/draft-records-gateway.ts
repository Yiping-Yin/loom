/**
 * Supabase-backed CollectionGateway for the `draft_records` table. Returns null
 * when Supabase is unconfigured (inert). Mirrors profile-gateway.ts.
 */
import { getSupabaseClient } from '../supabase/client';
import type { CollectionGateway, CollectionRow } from './collection-sync';

export function draftRecordsGateway(): CollectionGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  return {
    async fetchAll(userId): Promise<CollectionRow[]> {
      const { data, error } = await sb
        .from('draft_records')
        .select('record_id, data, deleted, updated_at')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.record_id as string,
        data: row.data,
        deleted: Boolean(row.deleted),
        updatedAt: Date.parse(row.updated_at as string) || 0,
      }));
    },
    async upsert(userId, id, data, deleted, updatedAt): Promise<void> {
      const { error } = await sb.from('draft_records').upsert(
        {
          user_id: userId,
          record_id: id,
          data,
          deleted,
          updated_at: new Date(updatedAt).toISOString(),
        },
        { onConflict: 'user_id,record_id' },
      );
      if (error) throw error;
    },
  };
}
