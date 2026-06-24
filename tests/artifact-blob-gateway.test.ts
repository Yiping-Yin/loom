import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artifactBlobGateway } from '../lib/artifact/artifact-blob-gateway';

test('gateway is null when Supabase is unconfigured (no env)', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(artifactBlobGateway(), null);
});
