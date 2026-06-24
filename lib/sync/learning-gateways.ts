/**
 * Supabase gateways for the learning-engine tables (Phase 4): traces / panels /
 * weaves. One factory, three tables. Each returns null when Supabase is
 * unconfigured (inert), mirroring the Phase 1/3 gateways.
 */
import { getSupabaseClient } from '../supabase/client';
import type { AsyncCollectionGateway, AsyncCollectionRow } from './async-collection-sync';

function tableGateway(table: string, idColumn: string): AsyncCollectionGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  return {
    async fetchAll(userId): Promise<AsyncCollectionRow[]> {
      // select('*') (static) — a dynamic column-list template breaks supabase-js's
      // compile-time select parser; we read the needed columns off each row.
      const { data, error } = await sb.from(table).select('*').eq('user_id', userId);
      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: row[idColumn] as string,
        data: row.data,
        deleted: Boolean(row.deleted),
        updatedAt: Date.parse(row.updated_at as string) || 0,
      }));
    },
    async upsert(userId, id, data, deleted, updatedAt): Promise<void> {
      const { error } = await sb.from(table).upsert(
        { user_id: userId, [idColumn]: id, data, deleted, updated_at: new Date(updatedAt).toISOString() },
        { onConflict: `user_id,${idColumn}` },
      );
      if (error) throw error;
    },
  };
}

export function tracesGateway(): AsyncCollectionGateway | null { return tableGateway('traces', 'trace_id'); }
export function panelsGateway(): AsyncCollectionGateway | null { return tableGateway('panels', 'panel_id'); }
export function weavesGateway(): AsyncCollectionGateway | null { return tableGateway('weaves', 'weave_id'); }
