import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncAllCollections } from '../lib/sync/use-drafts-sync';

test('syncAllCollections returns synced when all engines succeed', async () => {
  const ok = { syncOnce: async () => 'synced' as const };
  assert.equal(await syncAllCollections('u1', [ok, ok]), 'synced');
});

test('syncAllCollections returns error if any engine errors', async () => {
  const ok = { syncOnce: async () => 'synced' as const };
  const bad = { syncOnce: async () => 'error' as const };
  assert.equal(await syncAllCollections('u1', [ok, bad]), 'error');
});

test('syncAllCollections with no engines (unconfigured) is synced no-op', async () => {
  assert.equal(await syncAllCollections('u1', []), 'synced');
});
