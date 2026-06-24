import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncAllLearning } from '../lib/sync/use-learning-sync';

test('syncAllLearning returns synced when all engines succeed', async () => {
  const ok = { syncOnce: async () => 'synced' as const };
  assert.equal(await syncAllLearning('u', [ok, ok, ok]), 'synced');
});

test('syncAllLearning returns error if any engine errors', async () => {
  const ok = { syncOnce: async () => 'synced' as const };
  const bad = { syncOnce: async () => 'error' as const };
  assert.equal(await syncAllLearning('u', [ok, bad, ok]), 'error');
});

test('syncAllLearning with no engines (unconfigured) is synced no-op', async () => {
  assert.equal(await syncAllLearning('u', []), 'synced');
});
