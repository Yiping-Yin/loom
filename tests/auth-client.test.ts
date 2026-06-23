import test from 'node:test';
import assert from 'node:assert/strict';

import { signIn, getSession, onAuthChange } from '../lib/auth/auth-client';

test('signIn returns unconfigured when Supabase is absent', async () => {
  const r = await signIn('a@b.com', 'pw');
  assert.deepEqual(r, { ok: false, error: 'unconfigured' });
});

test('getSession returns null when unconfigured', async () => {
  assert.equal(await getSession(), null);
});

test('onAuthChange returns a no-op unsubscribe when unconfigured', () => {
  const off = onAuthChange(() => {});
  assert.equal(typeof off, 'function');
  assert.doesNotThrow(off);
});
