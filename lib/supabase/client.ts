/**
 * The ONLY place that reads NEXT_PUBLIC_SUPABASE_*. Returns a singleton browser
 * Supabase client, or null when unconfigured — so the whole backend layer is
 * inert in builds/tests without env (LOOM then runs 100% local, as today).
 *
 * The anon key is public by design; Row-Level Security is the real protection.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

function readEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return readEnv() !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const env = readEnv();
  cached = env ? createClient(env.url, env.key) : null;
  return cached;
}
