import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const client = read('../app/account/AccountClient.tsx');
const page = read('../app/account/page.tsx');

test('account client wires auth + sync + sign-out', () => {
  assert.match(client, /useProfileSync/);
  assert.match(client, /signIn\(/);
  assert.match(client, /signOut\(/);
});

test('account client surfaces the unconfigured (cloud off) state', () => {
  assert.match(client, /isSupabaseConfigured/);
});

test('account page sets a title and renders the client', () => {
  assert.match(page, /metadata/);
  assert.match(page, /AccountClient/);
});

test('/account is classified as an internal route', () => {
  const shell = read('../lib/new-loom/product-shell.ts');
  assert.match(shell, /'\/account'/);
});
