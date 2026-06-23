/**
 * Narrow Postgres seam the sync engine depends on (NOT the full Supabase client),
 * so the engine is testable with an in-memory fake. The real impl wraps the
 * `profiles` table; returns null when Supabase is unconfigured.
 */
import { getSupabaseClient } from '../supabase/client';
import { type ProfileRow } from './profile-mapper';

export interface ProfileGateway {
  fetch(userId: string): Promise<{ data: unknown; updated_at: string } | null>;
  upsert(row: ProfileRow): Promise<void>;
}

/** Real gateway, or null when Supabase isn't configured. */
export function supabaseProfileGateway(): ProfileGateway | null {
  const sb = getSupabaseClient();
  if (!sb) return null;
  return {
    async fetch(userId) {
      const { data, error } = await sb
        .from('profiles')
        .select('data, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    async upsert(row) {
      const { error } = await sb.from('profiles').upsert(row, { onConflict: 'user_id' });
      if (error) throw error;
    },
  };
}
