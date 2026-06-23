import test from 'node:test';
import assert from 'node:assert/strict';

// No NEXT_PUBLIC_SUPABASE_* in the test env → the module must be inert.
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client';

test('isSupabaseConfigured is false when env vars are absent', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(isSupabaseConfigured(), false);
});

test('getSupabaseClient returns null when unconfigured (no throw)', () => {
  assert.equal(getSupabaseClient(), null);
});
