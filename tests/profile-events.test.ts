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
let target: EventTarget;

before(() => {
  mem = new MemStorage();
  target = new EventTarget();
  // @ts-ignore test environment
  globalThis.window = {
    localStorage: mem,
    dispatchEvent: (e: Event) => target.dispatchEvent(e),
    addEventListener: (t: string, cb: EventListenerOrEventListenerObject) => target.addEventListener(t, cb),
    removeEventListener: (t: string, cb: EventListenerOrEventListenerObject) => target.removeEventListener(t, cb),
  };
});

beforeEach(() => mem.clear());

test('writeBeginnerProfileLocal emits the change event on success', async () => {
  const { writeBeginnerProfileLocal } = await import('../lib/profile/profile-storage');
  const { BEGINNER_PROFILE_CHANGE_EVENT } = await import('../lib/profile/profile-events');
  let fired = 0;
  const handler = () => { fired += 1; };
  target.addEventListener(BEGINNER_PROFILE_CHANGE_EVENT, handler);
  const ok = writeBeginnerProfileLocal({
    version: 1, home: { name: 'A', headline: 'B' },
    about: { summary: '', links: [] }, education: [], experience: [], works: [],
    artifacts: [], capabilities: [],
  });
  target.removeEventListener(BEGINNER_PROFILE_CHANGE_EVENT, handler);
  assert.equal(ok, true);
  assert.equal(fired, 1);
});

test('notifyBeginnerProfileChanged is a no-op under SSR (no window)', async () => {
  const { notifyBeginnerProfileChanged } = await import('../lib/profile/profile-events');
  const saved = globalThis.window;
  // @ts-ignore
  delete globalThis.window;
  assert.doesNotThrow(() => notifyBeginnerProfileChanged());
  // @ts-ignore
  globalThis.window = saved;
});
