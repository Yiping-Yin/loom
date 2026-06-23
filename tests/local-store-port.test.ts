import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

class MemStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  key(i: number) { return [...this.store.keys()][i] ?? null; }
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}
let mem: MemStorage;
before(() => {
  mem = new MemStorage();
  // @ts-ignore test environment
  globalThis.window = { localStorage: mem, dispatchEvent: () => true };
});
beforeEach(() => mem.clear());

test('port reads/writes the profile and the local version clock', async () => {
  const { localStorageProfilePort } = await import('../lib/sync/local-store-port');
  const port = localStorageProfilePort();
  assert.equal(port.read(), null);
  assert.equal(port.getLocalUpdatedAt(), 0);

  const ok = port.write({
    version: 1, home: { name: 'A', headline: 'B' },
    about: { summary: '', links: [] }, education: [], experience: [], works: [],
    artifacts: [], capabilities: [],
  });
  assert.equal(ok, true);
  assert.equal(port.read()!.home.name, 'A');

  port.setLocalUpdatedAt(12345);
  assert.equal(port.getLocalUpdatedAt(), 12345);
});
