/**
 * Supabase-backed CollectionGateway for the `drafts` table. Returns null when
 * Supabase is unconfigured, so the whole drafts-sync layer is inert without env.
 * Mirrors profile-gateway.ts.
 */
import { getSupabaseClient } from '../supabase/client';
import type { CollectionGateway, CollectionRow } from './collection-sync';

export function draftsGateway(): CollectionGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  return {
    async fetchAll(userId): Promise<CollectionRow[]> {
      const { data, error } = await sb
        .from('drafts')
        .select('draft_id, data, deleted, updated_at')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.draft_id as string,
        data: row.data,
        deleted: Boolean(row.deleted),
        updatedAt: Date.parse(row.updated_at as string) || 0,
      }));
    },
    async upsert(userId, id, data, deleted, updatedAt): Promise<void> {
      const { error } = await sb.from('drafts').upsert(
        {
          user_id: userId,
          draft_id: id,
          data,
          deleted,
          updated_at: new Date(updatedAt).toISOString(),
        },
        { onConflict: 'user_id,draft_id' },
      );
      if (error) throw error;
    },
  };
}
