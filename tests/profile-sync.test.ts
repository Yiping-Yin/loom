import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileSync } from '../lib/sync/profile-sync';
import type { ProfileGateway } from '../lib/sync/profile-gateway';
import type { ProfileLocalPort } from '../lib/sync/local-store-port';
import type { BeginnerProfile } from '../lib/profile/beginner-profile';

function mkProfile(name: string): BeginnerProfile {
  return {
    version: 1, home: { name, headline: 'h' },
    about: { summary: '', links: [] }, education: [], experience: [], works: [],
    artifacts: [], capabilities: [],
  };
}

function fakePort(initial?: BeginnerProfile, ts = 0): ProfileLocalPort & { _p: BeginnerProfile | null; _ts: number } {
  return {
    _p: initial ?? null, _ts: ts,
    read() { return this._p; },
    write(p) { this._p = p; return true; },
    getLocalUpdatedAt() { return this._ts; },
    setLocalUpdatedAt(ms) { this._ts = ms; },
  };
}
function fakeGateway(row?: { data: unknown; updated_at: string } | null): ProfileGateway & { _row: any; _upserts: number } {
  return {
    _row: row ?? null, _upserts: 0,
    async fetch() { return this._row; },
    async upsert(r) { this._row = { data: r.data, updated_at: r.updated_at }; this._upserts += 1; },
  };
}

test('migration: server empty + local present → push (upsert), no local change', async () => {
  const port = fakePort(mkProfile('Local'), 500);
  const gw = fakeGateway(null);
  const status = await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(gw._upserts, 1);
  assert.equal(port.read()!.home.name, 'Local');
  assert.equal(status, 'synced');
});

test('pull: server newer → local overwritten + clock advanced', async () => {
  const port = fakePort(mkProfile('Local'), 100);
  const gw = fakeGateway({ data: mkProfile('Remote'), updated_at: new Date(900).toISOString() });
  await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(port.read()!.home.name, 'Remote');
  assert.equal(port.getLocalUpdatedAt(), 900);
  assert.equal(gw._upserts, 0);
});

test('push: local newer → upsert with local clock', async () => {
  const port = fakePort(mkProfile('Local'), 900);
  const gw = fakeGateway({ data: mkProfile('Remote'), updated_at: new Date(100).toISOString() });
  await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(gw._upserts, 1);
  assert.equal(Date.parse(gw._row.updated_at), 900);
  assert.equal(port.read()!.home.name, 'Local');
});

test('error path → status "error", local untouched', async () => {
  const port = fakePort(mkProfile('Local'), 900);
  const gw: ProfileGateway = { async fetch() { throw new Error('network'); }, async upsert() {} };
  const status = await new ProfileSync(gw, port).syncOnce('u1');
  assert.equal(status, 'error');
  assert.equal(port.read()!.home.name, 'Local');
});
