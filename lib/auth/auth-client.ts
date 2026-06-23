/**
 * Thin, null-safe wrapper over Supabase Auth (email/password). Every method
 * degrades to an 'unconfigured' result when Supabase isn't set up, so callers
 * (and the static app without env) never crash.
 */
import { getSupabaseClient } from '../supabase/client';

export type AuthSession = { userId: string; email: string | null } | null;
export type SignInResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const sb = getSupabaseClient();
  if (!sb) return { ok: false, error: 'unconfigured' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  const u = data.user;
  return { ok: true, session: u ? { userId: u.id, email: u.email ?? null } : null };
}

export async function signOut(): Promise<void> {
  await getSupabaseClient()?.auth.signOut();
}

export async function getSession(): Promise<AuthSession> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? { userId: u.id, email: u.email ?? null } : null;
}

/** Subscribe to auth changes. Returns unsubscribe. No-op when unconfigured. */
export function onAuthChange(cb: (s: AuthSession) => void): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_evt, session) => {
    const u = session?.user;
    cb(u ? { userId: u.id, email: u.email ?? null } : null);
  });
  return () => data.subscription.unsubscribe();
}
