import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tracesGateway, panelsGateway, weavesGateway } from '../lib/sync/learning-gateways';

test('gateways are null when Supabase is unconfigured (no env)', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(tracesGateway(), null);
  assert.equal(panelsGateway(), null);
  assert.equal(weavesGateway(), null);
});
