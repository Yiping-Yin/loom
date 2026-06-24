import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftsGateway } from '../lib/sync/drafts-gateway';
import { draftRecordsGateway } from '../lib/sync/draft-records-gateway';

test('gateways are null when Supabase is unconfigured (no env)', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(draftsGateway(), null);
  assert.equal(draftRecordsGateway(), null);
});
